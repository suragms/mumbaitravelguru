using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Vendor;

namespace MumbaiTravelGuru.Application.Features.Vendor.Queries;

public record GetVendorProfileQuery : IRequest<VendorProfileDto?>;

public class GetVendorProfileQueryHandler : IRequestHandler<GetVendorProfileQuery, VendorProfileDto?>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetVendorProfileQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<VendorProfileDto?> Handle(GetVendorProfileQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null) return null;

        var vendor = await _context.VendorAccounts
            .FirstOrDefaultAsync(v => v.UserId == userId.Value && !v.IsDeleted, cancellationToken);
        if (vendor is null) return null;

        return new VendorProfileDto(
            vendor.Id, vendor.BusinessName, vendor.BusinessType.ToString(),
            vendor.ContactEmail, vendor.ContactPhone, vendor.Address,
            vendor.GSTIN, vendor.IsOnboarded, vendor.CommissionRate, vendor.CreatedAt);
    }
}

public record GetVendorDashboardQuery : IRequest<VendorDashboardDto>;

public class GetVendorDashboardQueryHandler : IRequestHandler<GetVendorDashboardQuery, VendorDashboardDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetVendorDashboardQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<VendorDashboardDto> Handle(GetVendorDashboardQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var vendor = await _context.VendorAccounts
            .FirstOrDefaultAsync(v => v.UserId == userId && !v.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Vendor account not found.");

        var vendorId = vendor.Id;

        var activeListings = await _context.VendorListings
            .CountAsync(l => l.VendorAccountId == vendorId && l.IsActive && !l.IsDeleted, cancellationToken);

        var bookingsQuery = _context.VendorBookings
            .Where(b => b.VendorAccountId == vendorId && !b.IsDeleted);

        var totalBookings = await bookingsQuery.CountAsync(cancellationToken);
        var pendingBookings = await bookingsQuery.CountAsync(b => b.Status == "Pending", cancellationToken);

        var totalRevenue = await bookingsQuery.SumAsync(b => b.TotalAmount, cancellationToken);
        var totalCommission = await bookingsQuery.SumAsync(b => b.CommissionAmount, cancellationToken);
        var netRevenue = await bookingsQuery.SumAsync(b => b.NetAmount, cancellationToken);

        var pendingPayout = await _context.VendorPayouts
            .Where(p => p.VendorAccountId == vendorId && p.Status == Domain.Enums.VendorPayoutStatus.Pending && !p.IsDeleted)
            .SumAsync(p => p.NetAmount, cancellationToken);

        var recentBooking = await bookingsQuery
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new VendorBookingDto(
                b.Id, b.VendorListingId, b.VendorListing.Title, b.BookingId,
                b.GuestName, b.GuestContact, b.GuestEmail,
                b.CheckIn, b.CheckOut, b.Units,
                b.TotalAmount, b.CommissionAmount, b.NetAmount,
                b.Currency, b.Status, b.CreatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        return new VendorDashboardDto(
            activeListings, totalBookings, pendingBookings,
            totalRevenue, totalCommission, netRevenue, pendingPayout, recentBooking);
    }
}
