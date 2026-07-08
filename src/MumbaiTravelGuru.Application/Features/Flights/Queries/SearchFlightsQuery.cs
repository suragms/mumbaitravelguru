using FluentValidation;
using MediatR;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Flight;
using MumbaiTravelGuru.Domain.Enums;
using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Application.Features.Flights.Queries;

public record SearchFlightsQuery(
    string Origin,
    List<string> Destinations,
    List<string> DepartureDates,
    int Adults,
    int Children,
    int Infants,
    string CabinClass,
    string TripType,
    string? Currency
) : IRequest<List<FlightOfferDto>>;

public class SearchFlightsQueryValidator : AbstractValidator<SearchFlightsQuery>
{
    public SearchFlightsQueryValidator()
    {
        RuleFor(v => v.Origin).NotEmpty().Length(3, 3);
        RuleFor(v => v.Destinations).NotEmpty();
        RuleFor(v => v.DepartureDates).NotEmpty();
        RuleFor(v => v.Adults).GreaterThan(0);
        RuleFor(v => v.Children).GreaterThanOrEqualTo(0);
        RuleFor(v => v.Infants).GreaterThanOrEqualTo(0);
    }
}

public class SearchFlightsQueryHandler : IRequestHandler<SearchFlightsQuery, List<FlightOfferDto>>
{
    private readonly IFlightSupplierAdapter _supplier;

    public SearchFlightsQueryHandler(IFlightSupplierAdapter supplier)
    {
        _supplier = supplier;
    }

    public async Task<List<FlightOfferDto>> Handle(SearchFlightsQuery request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<CabinClass>(request.CabinClass, true, out var cabinClass))
            cabinClass = CabinClass.Economy;

        if (!Enum.TryParse<TripType>(request.TripType, true, out var tripType))
            tripType = TripType.OneWay;

        var criteria = new FlightSearchCriteria
        {
            Origin = request.Origin.ToUpperInvariant(),
            Destinations = request.Destinations.Select(d => d.ToUpperInvariant()).ToList(),
            DepartureDates = request.DepartureDates.Select(d => DateTime.Parse(d).ToUniversalTime()).ToList(),
            Adults = request.Adults,
            Children = request.Children,
            Infants = request.Infants,
            CabinClass = cabinClass,
            TripType = tripType,
            Currency = request.Currency,
        };

        var offers = await _supplier.SearchFlightsAsync(criteria, cancellationToken);

        return offers.Select(o => new FlightOfferDto
        {
            OfferId = o.OfferId,
            TripType = o.TripType.ToString(),
            OutboundSegments = o.OutboundSegments.Select(MapSegment).ToList(),
            ReturnSegments = o.ReturnSegments.Select(MapSegment).ToList(),
            TotalPrice = o.TotalPrice,
            BaseFare = o.BaseFare,
            Taxes = o.Taxes,
            OtherCharges = o.OtherCharges,
            Currency = o.Currency,
            TotalStops = o.TotalStops,
            TotalDurationMinutes = o.TotalDurationMinutes,
            Airline = o.Airline,
            SeatsAvailable = o.SeatsAvailable,
            PriceExpiryUtc = o.PriceExpiryUtc,
            FareRules = o.FareRules,
        }).ToList();
    }

    private static FlightSegmentDto MapSegment(FlightSegment s) => new()
    {
        DepartureAirportCode = s.DepartureAirportCode,
        ArrivalAirportCode = s.ArrivalAirportCode,
        DepartureTime = s.DepartureTime,
        ArrivalTime = s.ArrivalTime,
        Airline = s.Airline,
        FlightNumber = s.FlightNumber,
        Cabin = s.Cabin.ToString(),
        DurationMinutes = s.DurationMinutes,
    };
}
