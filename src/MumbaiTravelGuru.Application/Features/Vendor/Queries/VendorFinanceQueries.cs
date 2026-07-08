using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Vendor;

namespace MumbaiTravelGuru.Application.Features.Vendor.Queries;

public record GetVendorCommissionStatementQuery(DateTime? From, DateTime? To) : IRequest<VendorCommissionStatementDto>;

public class GetVendorCommissionStatementQueryHandler : IRequestHandler<GetVendorCommissionStatementQuery, VendorCommissionStatementDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetVendorCommissionStatementQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<VendorCommissionStatementDto> Handle(GetVendorCommissionStatementQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var vendor = await _context.VendorAccounts
            .FirstOrDefaultAsync(v => v.UserId == userId && !v.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Vendor account not found.");

        var periodStart = request.From ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var periodEnd = request.To ?? periodStart.AddMonths(1).AddDays(-1);

        var bookings = await _context.VendorBookings
            .Where(b => b.VendorAccountId == vendor.Id && !b.IsDeleted
                && b.CreatedAt >= periodStart && b.CreatedAt <= periodEnd.AddDays(1))
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new VendorBookingDto(
                b.Id, b.VendorListingId, b.VendorListing.Title, b.BookingId,
                b.GuestName, b.GuestContact, b.GuestEmail,
                b.CheckIn, b.CheckOut, b.Units,
                b.TotalAmount, b.CommissionAmount, b.NetAmount,
                b.Currency, b.Status, b.CreatedAt))
            .ToListAsync(cancellationToken);

        return new VendorCommissionStatementDto(
            periodStart, periodEnd,
            bookings.Count,
            bookings.Sum(b => b.TotalAmount),
            bookings.Sum(b => b.CommissionAmount),
            bookings.Sum(b => b.NetAmount),
            bookings);
    }
}

public record GetVendorPayoutsQuery(int Page = 1, int PageSize = 20) : IRequest<VendorPayoutListResult>;

public record VendorPayoutListResult(List<VendorPayoutDto> Items, int TotalCount, int Page, int PageSize);

public class GetVendorPayoutsQueryHandler : IRequestHandler<GetVendorPayoutsQuery, VendorPayoutListResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetVendorPayoutsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<VendorPayoutListResult> Handle(GetVendorPayoutsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var vendorId = await _context.VendorAccounts
            .Where(v => v.UserId == userId && !v.IsDeleted)
            .Select(v => v.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (vendorId == Guid.Empty)
            throw new InvalidOperationException("Vendor account not found.");

        var query = _context.VendorPayouts
            .Where(p => p.VendorAccountId == vendorId && !p.IsDeleted);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new VendorPayoutDto(
                p.Id, p.Amount, p.CommissionAmount, p.NetAmount,
                p.Currency, p.PeriodStart, p.PeriodEnd,
                p.Status.ToString(), p.PaidAt, p.TransactionReference, p.CreatedAt))
            .ToListAsync(cancellationToken);

        return new VendorPayoutListResult(items, totalCount, request.Page, request.PageSize);
    }
}

public record GetVendorPayoutDetailQuery(Guid PayoutId) : IRequest<VendorPayoutDetailDto?>;

public class GetVendorPayoutDetailQueryHandler : IRequestHandler<GetVendorPayoutDetailQuery, VendorPayoutDetailDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetVendorPayoutDetailQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<VendorPayoutDetailDto?> Handle(GetVendorPayoutDetailQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var payout = await _context.VendorPayouts
            .Include(p => p.LineItems)
            .ThenInclude(i => i.VendorBooking)
            .FirstOrDefaultAsync(p => p.Id == request.PayoutId && p.VendorAccount.UserId == userId && !p.IsDeleted, cancellationToken);

        if (payout is null) return null;

        return new VendorPayoutDetailDto(
            payout.Id, payout.Amount, payout.CommissionAmount, payout.NetAmount,
            payout.Currency, payout.PeriodStart, payout.PeriodEnd,
            payout.Status.ToString(), payout.PaidAt, payout.TransactionReference,
            payout.CreatedAt,
            payout.LineItems.Select(i => new VendorPayoutLineItemDto(
                i.Id, i.VendorBookingId, i.VendorBooking.GuestName,
                i.BookingAmount, i.CommissionAmount, i.NetAmount)).ToList());
    }
}
