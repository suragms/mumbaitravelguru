using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Enums;
using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Infrastructure.Services.Flights;

public class MockFlightSupplierAdapter : IFlightSupplierAdapter
{
    private static readonly Random _rng = new();
    private static readonly string[] Airlines = { "IndiGo", "Air India", "SpiceJet", "Vistara", "Akasa Air", "Go First" };
    private static readonly string[] FareClasses = { "Economy Saver", "Economy Flexi", "Premium Economy", "Business Saver", "Business Flexi" };

    private static readonly Dictionary<string, (string Name, string City, string Country)> Airports = new()
    {
        ["BOM"] = ("Chhatrapati Shivaji Maharaj International Airport", "Mumbai", "India"),
        ["DEL"] = ("Indira Gandhi International Airport", "Delhi", "India"),
        ["BLR"] = ("Kempegowda International Airport", "Bengaluru", "India"),
        ["MAA"] = ("Chennai International Airport", "Chennai", "India"),
        ["CCU"] = ("Netaji Subhas Chandra Bose International Airport", "Kolkata", "India"),
        ["HYD"] = ("Rajiv Gandhi International Airport", "Hyderabad", "India"),
        ["COK"] = ("Cochin International Airport", "Kochi", "India"),
        ["GOI"] = ("Dabolim International Airport", "Goa", "India"),
        ["JAI"] = ("Jaipur International Airport", "Jaipur", "India"),
        ["PNQ"] = ("Pune International Airport", "Pune", "India"),
        ["LHR"] = ("Heathrow Airport", "London", "United Kingdom"),
        ["DXB"] = ("Dubai International Airport", "Dubai", "UAE"),
        ["BKK"] = ("Suvarnabhumi Airport", "Bangkok", "Thailand"),
        ["SIN"] = ("Singapore Changi Airport", "Singapore", "Singapore"),
        ["JFK"] = ("John F. Kennedy International Airport", "New York", "United States"),
    };

    public Task<List<FlightOffer>> SearchFlightsAsync(FlightSearchCriteria criteria, CancellationToken cancellationToken = default)
    {
        var results = new List<FlightOffer>();

        for (int i = 0; i < 12; i++)
        {
            var airline = Airlines[_rng.Next(Airlines.Length)];
            var fareClass = FareClasses[_rng.Next(FareClasses.Length)];
            var depTime = criteria.DepartureDates[0].Date.AddHours(_rng.Next(5, 23)).AddMinutes(_rng.Next(0, 59));

            var basePrice = criteria.CabinClass switch
            {
                CabinClass.Economy => _rng.Next(3500, 9000),
                CabinClass.PremiumEconomy => _rng.Next(9000, 16000),
                CabinClass.Business => _rng.Next(18000, 45000),
                CabinClass.First => _rng.Next(45000, 90000),
                _ => _rng.Next(3500, 9000),
            };

            var adultMultiplier = criteria.Adults + criteria.Children * 0.75m + criteria.Infants * 0.1m;
            if (adultMultiplier == 0) adultMultiplier = 1;
            var totalBase = basePrice * adultMultiplier;
            var taxes = totalBase * _rng.Next(10, 25) / 100m;
            var charges = totalBase * _rng.Next(2, 8) / 100m;
            var total = totalBase + taxes + charges;

            var duration = _rng.Next(90, 240);
            var stops = i < 3 ? 0 : i < 7 ? 1 : 2;

            var outbound = BuildSegments(criteria.Origin, criteria.Destinations[0], depTime, duration, stops, airline, criteria.CabinClass);

            var offer = new FlightOffer
            {
                OfferId = $"MOCK-{Guid.NewGuid():N}"[..16],
                TripType = criteria.TripType,
                OutboundSegments = outbound,
                BaseFare = Math.Round(totalBase, 2),
                Taxes = Math.Round(taxes, 2),
                OtherCharges = Math.Round(charges, 2),
                TotalPrice = Math.Round(total, 2),
                Currency = criteria.Currency ?? "INR",
                SeatsAvailable = _rng.Next(1, 9),
                PriceExpiryUtc = DateTime.UtcNow.AddMinutes(_rng.Next(5, 15)),
                FareClass = fareClass,
            };

            if (criteria.TripType == TripType.RoundTrip && criteria.DepartureDates.Count > 1)
            {
                var returnDep = criteria.DepartureDates[1].Date.AddHours(_rng.Next(5, 23)).AddMinutes(_rng.Next(0, 59));
                var returnDuration = _rng.Next(90, 240);
                var returnStops = _rng.Next(0, 2);
                var returnSegments = BuildSegments(criteria.Destinations[0], criteria.Origin, returnDep, returnDuration, returnStops, airline, criteria.CabinClass);
                offer.ReturnSegments = returnSegments;
            }

            results.Add(offer);
        }

        return Task.FromResult(results.OrderBy(o => o.TotalPrice).ToList());
    }

    public Task<FlightOffer?> GetOfferByIdAsync(string offerId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<FlightOffer?>(new FlightOffer
        {
            OfferId = offerId,
            TotalPrice = _rng.Next(5000, 15000),
            Currency = "INR",
            SeatsAvailable = 5,
            PriceExpiryUtc = DateTime.UtcNow.AddMinutes(10),
        });
    }

    public Task<FareLock?> LockFareAsync(string offerId, FlightSearchCriteria criteria, CancellationToken cancellationToken = default)
    {
        var fareLock = new FareLock
        {
            OfferId = offerId,
            SupplierId = "MOCK",
            LockedPrice = _rng.Next(5000, 15000),
            Currency = "INR",
            SearchCriteria = criteria,
            LockedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10),
        };
        return Task.FromResult<FareLock?>(fareLock);
    }

    public Task<ConfirmBookingResult> ConfirmBookingAsync(FareLock fareLock, List<TravelerInfo> travelers, CancellationToken cancellationToken = default)
    {
        var pnr = "PNR" + _rng.Next(1000000, 9999999);
        var result = new ConfirmBookingResult(
            true,
            pnr,
            "SYS" + _rng.Next(10000, 99999),
            "Confirmed",
            $"/api/v1/bookings/flight/e-ticket/{pnr}",
            null
        );
        return Task.FromResult(result);
    }

    private static List<FlightSegment> BuildSegments(string from, string to, DateTime depTime, int totalDuration, int stops, string airline, CabinClass cabin)
    {
        var segments = new List<FlightSegment>();
        var currentFrom = from;
        var currentTime = depTime;

        var legs = stops + 1;
        var legDuration = totalDuration / legs;

        for (int i = 0; i < legs; i++)
        {
            var currentTo = i == legs - 1 ? to : GetRandomHub(currentFrom, to);
            var arrTime = currentTime.AddMinutes(legDuration + _rng.Next(-10, 20));

            segments.Add(new FlightSegment
            {
                DepartureAirportCode = currentFrom,
                ArrivalAirportCode = currentTo,
                DepartureTime = currentTime,
                ArrivalTime = arrTime,
                Airline = airline,
                FlightNumber = $"{airline[..2].ToUpper()}{_rng.Next(100, 9999)}",
                OperatingCarrier = airline,
                Cabin = cabin,
                DurationMinutes = (int)(arrTime - currentTime).TotalMinutes,
            });

            currentFrom = currentTo;
            currentTime = arrTime.AddMinutes(45 + _rng.Next(15, 60));
        }

        return segments;
    }

    private static string GetRandomHub(string from, string to)
    {
        var hubs = new[] { "DEL", "BOM", "BLR", "HYD" };
        var possible = hubs.Where(h => h != from && h != to).ToArray();
        return possible.Length > 0 ? possible[_rng.Next(possible.Length)] : "DEL";
    }
}
