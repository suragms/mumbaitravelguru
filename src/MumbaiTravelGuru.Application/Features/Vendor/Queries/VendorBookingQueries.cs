using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Vendor;

namespace MumbaiTravelGuru.Application.Features.Vendor.Queries;

public record GetVendorBookingsQuery(string? Status, string? Search, int Page = 1, int PageSize = 20)
    : IRequest<VendorBookingListResult>;

public record VendorBookingListResult(List<VendorBookingDto> Items, int TotalCount, int Page, int PageSize);

public class GetVendorBookingsQueryHandler : IRequestHandler<GetVendorBookingsQuery, VendorBookingListResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetVendorBookingsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<VendorBookingListResult> Handle(GetVendorBookingsQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var vendorId = await _context.VendorAccounts
            .Where(v => v.UserId == userId && !v.IsDeleted)
            .Select(v => v.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (vendorId == Guid.Empty)
            throw new InvalidOperationException("Vendor account not found.");

        var query = _context.VendorBookings
            .Where(b => b.VendorAccountId == vendorId && !b.IsDeleted);

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(b => b.Status == request.Status);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(b =>
                b.GuestName!.Contains(request.Search) ||
                b.BookingId.ToString().Contains(request.Search));

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(b => new VendorBookingDto(
                b.Id, b.VendorListingId, b.VendorListing.Title, b.BookingId,
                b.GuestName, b.GuestContact, b.GuestEmail,
                b.CheckIn, b.CheckOut, b.Units,
                b.TotalAmount, b.CommissionAmount, b.NetAmount,
                b.Currency, b.Status, b.CreatedAt))
            .ToListAsync(cancellationToken);

        return new VendorBookingListResult(items, totalCount, request.Page, request.PageSize);
    }
}

public record GetVendorBookingDetailQuery(Guid BookingId) : IRequest<VendorBookingDto?>;

public class GetVendorBookingDetailQueryHandler : IRequestHandler<GetVendorBookingDetailQuery, VendorBookingDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetVendorBookingDetailQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<VendorBookingDto?> Handle(GetVendorBookingDetailQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        return await _context.VendorBookings
            .Where(b => b.BookingId == request.BookingId && b.VendorAccount.UserId == userId && !b.IsDeleted)
            .Select(b => new VendorBookingDto(
                b.Id, b.VendorListingId, b.VendorListing.Title, b.BookingId,
                b.GuestName, b.GuestContact, b.GuestEmail,
                b.CheckIn, b.CheckOut, b.Units,
                b.TotalAmount, b.CommissionAmount, b.NetAmount,
                b.Currency, b.Status, b.CreatedAt))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
