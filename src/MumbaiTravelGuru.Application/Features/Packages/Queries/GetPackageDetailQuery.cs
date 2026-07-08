using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Package;

namespace MumbaiTravelGuru.Application.Features.Packages.Queries;

public record GetPackageDetailQuery(Guid Id) : IRequest<PackageDetailDto>;

public class GetPackageDetailQueryValidator : AbstractValidator<GetPackageDetailQuery>
{
    public GetPackageDetailQueryValidator() => RuleFor(v => v.Id).NotEmpty();
}

public class GetPackageDetailQueryHandler : IRequestHandler<GetPackageDetailQuery, PackageDetailDto>
{
    private readonly IApplicationDbContext _context;

    public GetPackageDetailQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<PackageDetailDto> Handle(GetPackageDetailQuery request, CancellationToken cancellationToken)
    {
        var package = await _context.Set<Domain.Entities.Package>()
            .Include(p => p.Itineraries.Where(i => !i.IsDeleted).OrderBy(i => i.DayNumber))
            .Include(p => p.Inclusions.Where(i => !i.IsDeleted).OrderBy(i => i.SortOrder))
            .Include(p => p.Exclusions.Where(e => !e.IsDeleted).OrderBy(e => e.SortOrder))
            .Include(p => p.FixedDepartures.Where(fd => fd.IsActive && !fd.IsDeleted).OrderBy(fd => fd.StartDate))
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Package not found.");

        var discount = package.DiscountedPricePerPerson.HasValue
            ? package.PricePerPerson - package.DiscountedPricePerPerson.Value
            : 0;
        var effectivePrice = package.DiscountedPricePerPerson ?? package.PricePerPerson;
        var tax = effectivePrice * 5 / 100;

        return new PackageDetailDto
        {
            Id = package.Id,
            Name = package.Name,
            Slug = package.Slug,
            Description = package.Description,
            Overview = package.Overview,
            Destination = package.Destination,
            Theme = package.Theme,
            DurationDays = package.DurationDays,
            DurationNights = package.DurationNights,
            PricePerPerson = package.PricePerPerson,
            DiscountedPricePerPerson = package.DiscountedPricePerPerson,
            Currency = package.Currency,
            PhotoUrls = package.PhotoUrls,
            Highlights = package.Highlights,
            IsFixedDeparture = package.IsFixedDeparture,
            Itineraries = package.Itineraries.Select(i => new PackageItineraryDto
            {
                DayNumber = i.DayNumber,
                Title = i.Title,
                Description = i.Description,
                Activities = i.Activities,
                Meals = i.Meals,
                Accommodation = i.Accommodation,
            }).ToList(),
            Inclusions = package.Inclusions.Select(i => new PackageInclusionDto { Description = i.Description }).ToList(),
            Exclusions = package.Exclusions.Select(e => new PackageExclusionDto { Description = e.Description }).ToList(),
            FixedDepartures = package.FixedDepartures.Select(fd => new FixedDepartureDto
            {
                Id = fd.Id,
                StartDate = fd.StartDate,
                EndDate = fd.EndDate,
                PricePerPerson = fd.PricePerPerson,
                DiscountedPricePerPerson = fd.DiscountedPricePerPerson,
                AvailableSpots = fd.AvailableSpots,
                TotalSpots = fd.TotalSpots,
                IsActive = fd.IsActive,
            }).ToList(),
            PriceBreakup = new PriceBreakupDto
            {
                BasePricePerPerson = package.PricePerPerson,
                DiscountPerPerson = discount,
                TaxPercentage = 5,
                TaxAmount = tax,
                TotalPerPerson = effectivePrice + tax,
            },
        };
    }
}
