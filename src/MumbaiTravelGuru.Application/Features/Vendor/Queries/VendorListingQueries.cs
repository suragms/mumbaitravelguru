using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Vendor;

namespace MumbaiTravelGuru.Application.Features.Vendor.Queries;

public record GetVendorListingsQuery : IRequest<List<VendorListingDto>>;

public class GetVendorListingsQueryHandler : IRequestHandler<GetVendorListingsQuery, List<VendorListingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetVendorListingsQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<VendorListingDto>> Handle(GetVendorListingsQuery request, CancellationToken cancellationToken)
    {
        var vendorId = await GetVendorIdAsync(cancellationToken);

        return await _context.VendorListings
            .Where(l => l.VendorAccountId == vendorId && !l.IsDeleted)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new VendorListingDto(
                l.Id, l.VendorAccountId, l.ListingType.ToString(), l.Title,
                l.Description, l.DefaultPrice, l.Currency, l.IsActive, l.CreatedAt))
            .ToListAsync(cancellationToken);
    }

    private async Task<Guid> GetVendorIdAsync(CancellationToken ct)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var vendor = await _context.VendorAccounts
            .FirstOrDefaultAsync(v => v.UserId == userId && !v.IsDeleted, ct)
            ?? throw new InvalidOperationException("Vendor account not found.");
        return vendor.Id;
    }
}
