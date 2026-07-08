using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.Features.Flights.Queries;
using MumbaiTravelGuru.Domain.Enums;
using MumbaiTravelGuru.Domain.Models;
using NSubstitute;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Features.Flights;

public class FlightSearchQueryHandlerTests
{
    private readonly IFlightSupplierAdapter _supplier;
    private readonly SearchFlightsQueryHandler _handler;

    public FlightSearchQueryHandlerTests()
    {
        _supplier = Substitute.For<IFlightSupplierAdapter>();
        _handler = new SearchFlightsQueryHandler(_supplier);
    }

    [Fact]
    public async Task Handle_ShouldReturnMappedOffers()
    {
        var offers = new List<FlightOffer>
        {
            new()
            {
                OfferId = "OFFER-1",
                TripType = TripType.RoundTrip,
                OutboundSegments = new List<FlightSegment>
                {
                    new()
                    {
                        DepartureAirportCode = "BOM",
                        ArrivalAirportCode = "DEL",
                        Airline = "TestAir",
                        FlightNumber = "TA101",
                        Cabin = CabinClass.Economy,
                        DurationMinutes = 120,
                        DepartureTime = DateTime.UtcNow.AddDays(7),
                        ArrivalTime = DateTime.UtcNow.AddDays(7).AddHours(2),
                    }
                },
                TotalPrice = 7500.50m,
                BaseFare = 6000m,
                Taxes = 1000m,
                OtherCharges = 500.50m,
                Currency = "INR",
                SeatsAvailable = 5,
                PriceExpiryUtc = DateTime.UtcNow.AddMinutes(10),
            }
        };

        _supplier.SearchFlightsAsync(Arg.Any<FlightSearchCriteria>(), Arg.Any<CancellationToken>())
            .Returns(offers);

        var query = new SearchFlightsQuery("BOM", new List<string> { "DEL" }, new List<string> { DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-dd") }, 1, 0, 0, "Economy", "OneWay", null);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.Single(result);
        Assert.Equal("OFFER-1", result[0].OfferId);
        Assert.Equal(7500.50m, result[0].TotalPrice);
        Assert.Single(result[0].OutboundSegments);
        Assert.Equal("BOM", result[0].OutboundSegments[0].DepartureAirportCode);
    }
}
