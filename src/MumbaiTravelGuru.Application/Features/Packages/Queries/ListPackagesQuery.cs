using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Package;

namespace MumbaiTravelGuru.Application.Features.Packages.Queries;

public record ListPackagesQuery(
    string? Destination,
    int? MaxDuration,
    string? Theme,
    decimal? MaxPrice
) : IRequest<List<PackageListItemDto>>;

public class ListPackagesQueryValidator : AbstractValidator<ListPackagesQuery> { }

public class ListPackagesQueryHandler : IRequestHandler<ListPackagesQuery, List<PackageListItemDto>>
{
    private readonly IApplicationDbContext _context;

    public ListPackagesQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<PackageListItemDto>> Handle(ListPackagesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Set<Domain.Entities.Package>()
            .Where(p => p.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Destination))
            query = query.Where(p => p.Destination.Contains(request.Destination));

        if (request.MaxDuration.HasValue)
            query = query.Where(p => p.DurationDays <= request.MaxDuration.Value);

        if (!string.IsNullOrWhiteSpace(request.Theme))
            query = query.Where(p => p.Theme == request.Theme);

        if (request.MaxPrice.HasValue)
            query = query.Where(p => p.DiscountedPricePerPerson.HasValue
                ? p.DiscountedPricePerPerson <= request.MaxPrice.Value
                : p.PricePerPerson <= request.MaxPrice.Value);

        return await query
            .OrderBy(p => p.PricePerPerson)
            .Select(p => new PackageListItemDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                Description = p.Description,
                Destination = p.Destination,
                Theme = p.Theme,
                DurationDays = p.DurationDays,
                DurationNights = p.DurationNights,
                PricePerPerson = p.PricePerPerson,
                DiscountedPricePerPerson = p.DiscountedPricePerPerson,
                Currency = p.Currency,
                PhotoUrls = p.PhotoUrls,
                Highlights = p.Highlights,
                IsFixedDeparture = p.IsFixedDeparture,
            })
            .ToListAsync(cancellationToken);
    }
}
