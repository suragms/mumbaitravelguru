using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Flight;
using MumbaiTravelGuru.Application.Features.Flights.Commands;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Models;
using MumbaiTravelGuru.Infrastructure.Persistence;
using MumbaiTravelGuru.Infrastructure.Services.Flights;
using NSubstitute;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Features.Flights;

public class InitiateFlightBookingCommandHandlerTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly ICurrentUserService _currentUser;
    private readonly IFlightSupplierAdapter _supplier;
    private readonly IFareLockStore _fareLockStore;
    private readonly IDateTime _dateTime;
    private readonly Guid _userId;

    public InitiateFlightBookingCommandHandlerTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _userId = Guid.NewGuid();
        _currentUser = Substitute.For<ICurrentUserService>();
        _currentUser.UserId.Returns(_userId);

        _supplier = Substitute.For<IFlightSupplierAdapter>();
        _fareLockStore = new InMemoryFareLockStore();
        _dateTime = Substitute.For<IDateTime>();
        _dateTime.UtcNow.Returns(DateTime.UtcNow);
    }

    [Fact]
    public async Task Handle_WithValidOffer_ShouldCreateBookingAndLockFare()
    {
        var offer = new FlightOffer
        {
            OfferId = "OFFER-1",
            TotalPrice = 8500m,
            Currency = "INR",
            SeatsAvailable = 5,
            PriceExpiryUtc = DateTime.UtcNow.AddMinutes(15),
            OutboundSegments = new List<FlightSegment>
            {
                new() { DepartureAirportCode = "BOM", ArrivalAirportCode = "DEL", Airline = "Test", FlightNumber = "T101", DurationMinutes = 120, DepartureTime = DateTime.UtcNow.AddDays(7), ArrivalTime = DateTime.UtcNow.AddDays(7).AddHours(2) }
            }
        };

        _supplier.GetOfferByIdAsync("OFFER-1", Arg.Any<CancellationToken>()).Returns(offer);
        _supplier.LockFareAsync("OFFER-1", Arg.Any<FlightSearchCriteria>(), Arg.Any<CancellationToken>())
            .Returns(new FareLock
            {
                OfferId = "OFFER-1",
                LockedPrice = 8500m,
                Currency = "INR",
                LockedAtUtc = DateTime.UtcNow,
                ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10),
            });

        using (var context = new ApplicationDbContext(_options))
        {
            context.Users.Add(new User { Id = _userId, Email = "test@test.com" });
            await context.SaveChangesAsync();
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new InitiateFlightBookingCommandHandler(context, _currentUser, _supplier, _fareLockStore, _dateTime);

            var travelers = new List<TravelerDetailDto>
            {
                new() { FirstName = "John", LastName = "Doe", PhoneNumber = "+919876543210" }
            };

            var result = await handler.Handle(new InitiateFlightBookingCommand("OFFER-1", travelers), CancellationToken.None);

            Assert.True(result.Succeeded);
            Assert.NotNull(result.LockId);
            Assert.Equal(8500m, result.LockedPrice);
            Assert.NotNull(result.BookingId);
        }
    }

    [Fact]
    public async Task Handle_WithExpiredOffer_ShouldReturnError()
    {
        var offer = new FlightOffer
        {
            OfferId = "OFFER-EXPIRED",
            TotalPrice = 5000m,
            SeatsAvailable = 3,
            PriceExpiryUtc = DateTime.UtcNow.AddMinutes(-5),
            OutboundSegments = new List<FlightSegment>(),
        };

        _supplier.GetOfferByIdAsync("OFFER-EXPIRED", Arg.Any<CancellationToken>()).Returns(offer);

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new InitiateFlightBookingCommandHandler(context, _currentUser, _supplier, _fareLockStore, _dateTime);

            var result = await handler.Handle(new InitiateFlightBookingCommand("OFFER-EXPIRED", new List<TravelerDetailDto> { new() { FirstName = "A", LastName = "B" } }), CancellationToken.None);

            Assert.False(result.Succeeded);
            Assert.Equal("Fare has expired. Please search again.", result.Error);
        }
    }

    [Fact]
    public async Task Handle_WithTamperedClientPrice_ShouldUseServerPrice()
    {
        // The client would have sent a tampered price in the request body,
        // but the handler ignores any client-supplied price and always
        // fetches the authoritative price from the supplier adapter.
        var offer = new FlightOffer
        {
            OfferId = "OFFER-TAMPER",
            TotalPrice = 12000m,        // Server says 12000
            Currency = "INR",
            SeatsAvailable = 3,
            PriceExpiryUtc = DateTime.UtcNow.AddMinutes(15),
            OutboundSegments = new List<FlightSegment>
            {
                new() { DepartureAirportCode = "BOM", ArrivalAirportCode = "DEL", Airline = "Test", FlightNumber = "T101", DurationMinutes = 120, DepartureTime = DateTime.UtcNow.AddDays(7), ArrivalTime = DateTime.UtcNow.AddDays(7).AddHours(2) }
            }
        };

        _supplier.GetOfferByIdAsync("OFFER-TAMPER", Arg.Any<CancellationToken>()).Returns(offer);
        _supplier.LockFareAsync("OFFER-TAMPER", Arg.Any<FlightSearchCriteria>(), Arg.Any<CancellationToken>())
            .Returns(new FareLock
            {
                OfferId = "OFFER-TAMPER",
                LockedPrice = 12000m,   // Server price
                Currency = "INR",
                LockedAtUtc = DateTime.UtcNow,
                ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10),
            });

        using (var context = new ApplicationDbContext(_options))
        {
            context.Users.Add(new User { Id = _userId, Email = "test@test.com" });
            await context.SaveChangesAsync();
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new InitiateFlightBookingCommandHandler(context, _currentUser, _supplier, _fareLockStore, _dateTime);

            var result = await handler.Handle(new InitiateFlightBookingCommand("OFFER-TAMPER", new List<TravelerDetailDto> { new() { FirstName = "A", LastName = "B" } }), CancellationToken.None);

            Assert.True(result.Succeeded);

            // The locked price comes from the server, NOT from any client input
            // Even if client sent { ..., price: 100 } in the offerId, the server re-fetches
            Assert.Equal(12000m, result.LockedPrice);
        }
    }
}
