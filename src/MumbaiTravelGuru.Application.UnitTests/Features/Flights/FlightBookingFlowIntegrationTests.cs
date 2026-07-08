using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Flight;
using MumbaiTravelGuru.Application.Features.Flights.Commands;
using MumbaiTravelGuru.Application.Features.Flights.Queries;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;
using MumbaiTravelGuru.Domain.Models;
using MumbaiTravelGuru.Infrastructure.Persistence;
using MumbaiTravelGuru.Infrastructure.Services.Flights;
using NSubstitute;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Features.Flights;

public class FlightBookingFlowIntegrationTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly Guid _userId;
    private readonly ICurrentUserService _currentUser;
    private readonly IFlightSupplierAdapter _supplier;
    private readonly IFareLockStore _fareLockStore;
    private readonly IDateTime _dateTime;
    private readonly DateTime _fixedNow;

    public FlightBookingFlowIntegrationTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _userId = Guid.NewGuid();
        _fixedNow = new DateTime(2026, 7, 8, 10, 0, 0, DateTimeKind.Utc);

        _currentUser = Substitute.For<ICurrentUserService>();
        _currentUser.UserId.Returns(_userId);

        _supplier = Substitute.For<IFlightSupplierAdapter>();
        _fareLockStore = new InMemoryFareLockStore();
        _dateTime = Substitute.For<IDateTime>();
        _dateTime.UtcNow.Returns(_fixedNow);
    }

    private async Task SeedUserAsync()
    {
        using var ctx = new ApplicationDbContext(_options);
        ctx.Users.Add(new User { Id = _userId, Email = "flyer@test.com", FirstName = "Jet", LastName = "Setter" });
        await ctx.SaveChangesAsync();
    }

    private static TravelerDetailDto DefaultTraveler() =>
        new() { FirstName = "John", LastName = "Doe", PhoneNumber = "+919876543210", Email = "john@test.com" };

    private static FareLock CreateFareLock(string lockId, string offerId, decimal price, DateTime? expiresAt = null)
    {
        return new FareLock
        {
            LockId = lockId,
            OfferId = offerId,
            SupplierId = "MOCK",
            LockedPrice = price,
            Currency = "INR",
            SearchCriteria = new FlightSearchCriteria(),
            LockedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = expiresAt ?? DateTime.UtcNow.AddMinutes(10),
        };
    }

    // ── Happy Path ──────────────────────────────────────────────

    [Fact]
    public async Task FullHappyPath_SearchInitiateConfirm_Succeeds()
    {
        // Step 1: Search
        _supplier.SearchFlightsAsync(Arg.Any<FlightSearchCriteria>(), Arg.Any<CancellationToken>())
            .Returns(new List<FlightOffer>
            {
                new()
                {
                    OfferId = "OFFER-HAPPY",
                    TripType = TripType.OneWay,
                    TotalPrice = 7500m,
                    BaseFare = 6000m, Taxes = 1000m, OtherCharges = 500m,
                    Currency = "INR", SeatsAvailable = 5,
                    PriceExpiryUtc = _fixedNow.AddMinutes(15),
                    OutboundSegments = new List<FlightSegment>
                    {
                        new() { DepartureAirportCode = "BOM", ArrivalAirportCode = "DEL",
                                Airline = "TestAir", FlightNumber = "TA101",
                                DepartureTime = _fixedNow.AddDays(7), ArrivalTime = _fixedNow.AddDays(7).AddHours(2),
                                DurationMinutes = 120, Cabin = CabinClass.Economy }
                    }
                }
            });

        var searchHandler = new SearchFlightsQueryHandler(_supplier);
        var searchResults = await searchHandler.Handle(
            new SearchFlightsQuery("BOM", new() { "DEL" }, new() { _fixedNow.AddDays(7).ToString("yyyy-MM-dd") },
                1, 0, 0, "Economy", "OneWay", null), CancellationToken.None);
        Assert.Single(searchResults);
        var offer = searchResults[0];

        // Step 2: Initiate booking
        await SeedUserAsync();
        _supplier.GetOfferByIdAsync("OFFER-HAPPY", Arg.Any<CancellationToken>()).Returns(
            new FlightOffer { OfferId = "OFFER-HAPPY", TotalPrice = 7500m, Currency = "INR", SeatsAvailable = 5,
                PriceExpiryUtc = _fixedNow.AddMinutes(15), OutboundSegments = new List<FlightSegment>
                {
                    new() { DepartureAirportCode = "BOM", ArrivalAirportCode = "DEL",
                            Airline = "Test", FlightNumber = "T101",
                            DepartureTime = _fixedNow.AddDays(7), ArrivalTime = _fixedNow.AddDays(7).AddHours(2),
                            DurationMinutes = 120 }
                } });

        _supplier.LockFareAsync("OFFER-HAPPY", Arg.Any<FlightSearchCriteria>(), Arg.Any<CancellationToken>())
            .Returns(CreateFareLock("LOCK-HAPPY", "OFFER-HAPPY", 7500m));

        using (var ctx = new ApplicationDbContext(_options))
        {
            var initiateHandler = new InitiateFlightBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
            var initiateResult = await initiateHandler.Handle(
                new InitiateFlightBookingCommand("OFFER-HAPPY", new() { DefaultTraveler() }), CancellationToken.None);
            Assert.True(initiateResult.Succeeded);
        }

        // Step 3: Confirm booking
        _supplier.ConfirmBookingAsync(Arg.Any<FareLock>(), Arg.Any<List<TravelerInfo>>(), Arg.Any<CancellationToken>())
            .Returns(new ConfirmBookingResult(true, "PNR123456", "SYS654321", "Confirmed", "/e-ticket/PNR123456", null));

        using (var ctx = new ApplicationDbContext(_options))
        {
            var confirmHandler = new ConfirmFlightBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
            var confirmResult = await confirmHandler.Handle(
                new ConfirmFlightBookingCommand("LOCK-HAPPY", "UPI", "txn-001"), CancellationToken.None);
            Assert.True(confirmResult.Succeeded);
            Assert.Equal("PNR123456", confirmResult.PnrNumber);
        }

        // Step 4: Verify final state
        using (var ctx = new ApplicationDbContext(_options))
        {
            var booking = await ctx.Bookings.FirstAsync(b => b.BookingType == BookingType.Flight);
            Assert.Equal(BookingStatus.Confirmed, booking.Status);
            Assert.Equal(7500m, booking.PaidAmount);
            Assert.Equal("PNR123456", booking.ConfirmationNumber);

            var payments = await ctx.Payments.Where(p => p.BookingId == booking.Id).ToListAsync();
            Assert.Single(payments);
            Assert.Equal(PaymentStatus.Completed, payments[0].Status);

            var auditLogs = await ctx.AuditLogs.Where(a => a.Action == "FlightBookingConfirmed").ToListAsync();
            Assert.NotEmpty(auditLogs);
        }
    }

    // ── Expired Fare Lock ───────────────────────────────────────

    [Fact]
    public async Task Confirm_WithExpiredFareLock_ReturnsError()
    {
        await SeedUserAsync();
        var expiredLock = CreateFareLock("LOCK-EXPIRED", "OFFER-X", 5000m, _fixedNow.AddMinutes(-1));
        _fareLockStore.Add(expiredLock);

        using var ctx = new ApplicationDbContext(_options);
        var handler = new ConfirmFlightBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
        var result = await handler.Handle(
            new ConfirmFlightBookingCommand("LOCK-EXPIRED", "Wallet", null), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Contains("expired", result.Error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Confirm_WithNonexistentLockId_ReturnsError()
    {
        await SeedUserAsync();
        using var ctx = new ApplicationDbContext(_options);
        var handler = new ConfirmFlightBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
        var result = await handler.Handle(
            new ConfirmFlightBookingCommand("LOCK-DOES-NOT-EXIST", "Wallet", null), CancellationToken.None);
        Assert.False(result.Succeeded);
    }

    // ── Duplicate submission / double-click ────────────────────

    [Fact]
    public async Task Initiate_CalledTwice_CreatesTwoSeparateBookings()
    {
        await SeedUserAsync();
        _supplier.GetOfferByIdAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(new FlightOffer { OfferId = "OFFER-DUP", TotalPrice = 8000m, Currency = "INR",
                SeatsAvailable = 10, PriceExpiryUtc = _fixedNow.AddMinutes(15),
                OutboundSegments = new List<FlightSegment>
                {
                    new() { DepartureAirportCode = "BOM", ArrivalAirportCode = "DEL",
                            Airline = "T", FlightNumber = "T1",
                            DepartureTime = _fixedNow.AddDays(7), ArrivalTime = _fixedNow.AddDays(7).AddHours(2),
                            DurationMinutes = 120 }
                } });

        _supplier.LockFareAsync(Arg.Any<string>(), Arg.Any<FlightSearchCriteria>(), Arg.Any<CancellationToken>())
            .Returns(CreateFareLock("LOCK-DUP", "OFFER-DUP", 8000m));

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new InitiateFlightBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
            var cmd = new InitiateFlightBookingCommand("OFFER-DUP", new() { DefaultTraveler() });

            var result1 = await handler.Handle(cmd, CancellationToken.None);
            Assert.True(result1.Succeeded);

            // The supplier adapter creates a new FareLock each time, so this should work
            // but it means the same offer gets locked twice.
            // Note: In production, the fare lock store should be keyed per-session.
            // This test documents the current behavior — two initiates = two pending bookings.
            var result2 = await handler.Handle(cmd, CancellationToken.None);
            // The second call will also succeed because the mock adapter creates a new Random-based fare lock
            Assert.True(result2.Succeeded);
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var bookings = await ctx.Bookings.Where(b => b.BookingType == BookingType.Flight).ToListAsync();
            Assert.Equal(2, bookings.Count);
            Assert.All(bookings, b => Assert.Equal(BookingStatus.Pending, b.Status));
        }
    }

    [Fact]
    public async Task Confirm_CalledTwice_FirstSucceedsSecondFails()
    {
        await SeedUserAsync();
        _fareLockStore.Add(CreateFareLock("LOCK-DBL", "OFFER-DBL", 9000m));

        _supplier.ConfirmBookingAsync(Arg.Any<FareLock>(), Arg.Any<List<TravelerInfo>>(), Arg.Any<CancellationToken>())
            .Returns(new ConfirmBookingResult(true, "PNR-DBL", "SYS-DBL", "Confirmed", null, null));

        var bookingId = Guid.NewGuid();
        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Bookings.Add(new Booking { Id = bookingId, UserId = _userId,
                BookingType = BookingType.Flight, Status = BookingStatus.Pending, TotalAmount = 9000m });
            ctx.Set<FlightBookingDetail>().Add(new FlightBookingDetail
            {
                FareLockId = "LOCK-DBL", BookingId = bookingId,
                Passengers = new List<FlightBookingPassenger>()
            });
            await ctx.SaveChangesAsync();
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new ConfirmFlightBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
            var cmd = new ConfirmFlightBookingCommand("LOCK-DBL", "UPI", "txn-001");

            var first = await handler.Handle(cmd, CancellationToken.None);
            Assert.True(first.Succeeded);
            Assert.Equal("PNR-DBL", first.PnrNumber);

            // Second call: fare lock was marked used => Get returns null
            var second = await handler.Handle(cmd, CancellationToken.None);
            Assert.False(second.Succeeded);
            Assert.Contains("expired", second.Error, StringComparison.OrdinalIgnoreCase);
        }
    }

    // ── Horizontal privilege escalation (the A01 fix) ──────────

    [Fact]
    public async Task Confirm_WithWrongUserId_ReturnsBookingNotFound()
    {
        var otherUserId = Guid.NewGuid();
        _fareLockStore.Add(CreateFareLock("LOCK-OTHER", "OFFER-OTHER", 6000m));

        var bookingId = Guid.NewGuid();
        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Users.Add(new User { Id = otherUserId, Email = "other@test.com" });
            ctx.Bookings.Add(new Booking { Id = bookingId, UserId = otherUserId,
                BookingType = BookingType.Flight, Status = BookingStatus.Pending, TotalAmount = 6000m });
            ctx.Set<FlightBookingDetail>().Add(new FlightBookingDetail
            {
                FareLockId = "LOCK-OTHER", BookingId = bookingId,
                Passengers = new List<FlightBookingPassenger>()
            });
            await ctx.SaveChangesAsync();
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new ConfirmFlightBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
            var result = await handler.Handle(
                new ConfirmFlightBookingCommand("LOCK-OTHER", "Wallet", null), CancellationToken.None);
            Assert.False(result.Succeeded);
            Assert.Equal("Booking not found.", result.Error);
        }
    }

    // ── Back-button/refresh mid-flow ────────────────────────────

    [Fact]
    public async Task InitiateThenSearchAgain_OriginalBookingStillPending()
    {
        // Simulates user clicking back after initiate, then initiating again
        await SeedUserAsync();
        _supplier.GetOfferByIdAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(new FlightOffer { OfferId = "OFFER-BACK", TotalPrice = 7000m, Currency = "INR",
                SeatsAvailable = 5, PriceExpiryUtc = _fixedNow.AddMinutes(15),
                OutboundSegments = new List<FlightSegment>
                {
                    new() { DepartureAirportCode = "BOM", ArrivalAirportCode = "DEL",
                            Airline = "T", FlightNumber = "T1", DurationMinutes = 120,
                            DepartureTime = _fixedNow.AddDays(7), ArrivalTime = _fixedNow.AddDays(7).AddHours(2) }
                } });

        _supplier.LockFareAsync(Arg.Any<string>(), Arg.Any<FlightSearchCriteria>(), Arg.Any<CancellationToken>())
            .Returns(CreateFareLock("LOCK-BACK", "OFFER-BACK", 7000m));

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new InitiateFlightBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
            await handler.Handle(new InitiateFlightBookingCommand("OFFER-BACK", new() { DefaultTraveler() }), CancellationToken.None);
        }

        // User clicks back, searches again, initiates again
        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new InitiateFlightBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
            await handler.Handle(new InitiateFlightBookingCommand("OFFER-BACK", new() { DefaultTraveler() }), CancellationToken.None);
        }

        // Both bookings should be Pending — no data lost
        using (var ctx = new ApplicationDbContext(_options))
        {
            var bookings = await ctx.Bookings.Where(b => b.BookingType == BookingType.Flight).OrderBy(b => b.CreatedAt).ToListAsync();
            Assert.Equal(2, bookings.Count);
            Assert.All(bookings, b => Assert.Equal(BookingStatus.Pending, b.Status));
        }
    }

    // ── Payment success + supplier confirmation failure ───────

    [Fact]
    public async Task Confirm_SupplierFails_BookingMarkedFailed()
    {
        await SeedUserAsync();
        _fareLockStore.Add(CreateFareLock("LOCK-FAIL", "OFFER-FAIL", 10000m));

        _supplier.ConfirmBookingAsync(Arg.Any<FareLock>(), Arg.Any<List<TravelerInfo>>(), Arg.Any<CancellationToken>())
            .Returns(new ConfirmBookingResult(false, null, null, null, null, "Supplier timeout"));

        var bookingId = Guid.NewGuid();
        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Bookings.Add(new Booking { Id = bookingId, UserId = _userId,
                BookingType = BookingType.Flight, Status = BookingStatus.Pending, TotalAmount = 10000m });
            ctx.Set<FlightBookingDetail>().Add(new FlightBookingDetail
            {
                FareLockId = "LOCK-FAIL", BookingId = bookingId,
                Passengers = new List<FlightBookingPassenger>(),
            });
            await ctx.SaveChangesAsync();
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new ConfirmFlightBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
            var result = await handler.Handle(
                new ConfirmFlightBookingCommand("LOCK-FAIL", "CreditCard", "txn-002"), CancellationToken.None);
            Assert.False(result.Succeeded);
            Assert.Equal("Supplier timeout", result.Error);
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var booking = await ctx.Bookings.FirstAsync(b => b.Id == bookingId);
            Assert.Equal(BookingStatus.Failed, booking.Status);
        }
    }

    // ── Cancellation of a confirmed booking ──────────────────

    [Fact]
    public async Task CancelPendingBooking_NoRefundNeeded()
    {
        await SeedUserAsync();
        var bookingId = Guid.NewGuid();
        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Bookings.Add(new Booking { Id = bookingId, UserId = _userId,
                BookingType = BookingType.Flight, Status = BookingStatus.Pending, TotalAmount = 5000m });
            await ctx.SaveChangesAsync();
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new MumbaiTravelGuru.Application.Features.Payments.Commands.CancelBookingCommandHandler(
                ctx, _currentUser, Substitute.For<IPaymentGateway>(), _dateTime);
            var result = await handler.Handle(
                new MumbaiTravelGuru.Application.Features.Payments.Commands.CancelBookingCommand(bookingId, "Changed mind"),
                CancellationToken.None);
            Assert.True(result.Succeeded);
            Assert.Equal("NoRefundNeeded", result.RefundStatus);
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var booking = await ctx.Bookings.FirstAsync(b => b.Id == bookingId);
            Assert.Equal(BookingStatus.Cancelled, booking.Status);
            Assert.Equal("Changed mind", booking.CancellationReason);
            Assert.NotNull(booking.CancelledAt);
        }
    }

    [Fact]
    public async Task CancelAlreadyCancelledBooking_ReturnsError()
    {
        await SeedUserAsync();
        var bookingId = Guid.NewGuid();
        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Bookings.Add(new Booking { Id = bookingId, UserId = _userId,
                BookingType = BookingType.Flight, Status = BookingStatus.Cancelled,
                CancelledAt = _fixedNow, TotalAmount = 5000m });
            await ctx.SaveChangesAsync();
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new MumbaiTravelGuru.Application.Features.Payments.Commands.CancelBookingCommandHandler(
                ctx, _currentUser, Substitute.For<IPaymentGateway>(), _dateTime);
            var result = await handler.Handle(
                new MumbaiTravelGuru.Application.Features.Payments.Commands.CancelBookingCommand(bookingId, "Try again"),
                CancellationToken.None);
            Assert.False(result.Succeeded);
            Assert.Equal("Booking is already cancelled.", result.Error);
        }
    }
}
