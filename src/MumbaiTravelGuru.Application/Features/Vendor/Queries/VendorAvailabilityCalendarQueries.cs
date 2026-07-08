using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Vendor;

namespace MumbaiTravelGuru.Application.Features.Vendor.Queries;

public record GetVendorListingAvailabilityQuery(Guid ListingId) : IRequest<List<VendorAvailabilityEntryDto>>;

public class GetVendorListingAvailabilityQueryHandler : IRequestHandler<GetVendorListingAvailabilityQuery, List<VendorAvailabilityEntryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetVendorListingAvailabilityQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<VendorAvailabilityEntryDto>> Handle(GetVendorListingAvailabilityQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var listing = await _context.VendorListings
            .Include(l => l.VendorAccount)
            .FirstOrDefaultAsync(l => l.Id == request.ListingId && l.VendorAccount.UserId == userId && !l.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Listing not found.");

        return await _context.VendorAvailabilityCalendars
            .Where(c => c.VendorListingId == request.ListingId && !c.IsDeleted)
            .OrderBy(c => c.Date)
            .Select(c => new VendorAvailabilityEntryDto(
                c.Id, c.Date, c.IsAvailable, c.AvailableUnits,
                c.PriceOverride, c.Notes))
            .ToListAsync(cancellationToken);
    }
}
