using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.Features.Hotels.Commands;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;
using MumbaiTravelGuru.Domain.Models;
using MumbaiTravelGuru.Infrastructure.Persistence;
using MumbaiTravelGuru.Infrastructure.Services.Flights;
using NSubstitute;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Features.Hotels;

public class HotelBookingFlowIntegrationTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly Guid _userId;
    private readonly ICurrentUserService _currentUser;
    private readonly IHotelSupplierAdapter _supplier;
    private readonly IFareLockStore _fareLockStore;
    private readonly IDateTime _dateTime;
    private readonly DateTime _fixedNow;

    public HotelBookingFlowIntegrationTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _userId = Guid.NewGuid();
        _fixedNow = new DateTime(2026, 7, 8, 10, 0, 0, DateTimeKind.Utc);

        _currentUser = Substitute.For<ICurrentUserService>();
        _currentUser.UserId.Returns(_userId);

        _supplier = Substitute.For<IHotelSupplierAdapter>();
        _fareLockStore = new InMemoryFareLockStore();
        _dateTime = Substitute.For<IDateTime>();
        _dateTime.UtcNow.Returns(_fixedNow);
    }

    private async Task SeedUserAsync()
    {
        using var ctx = new ApplicationDbContext(_options);
        ctx.Users.Add(new User { Id = _userId, Email = "hotelier@test.com" });
        await ctx.SaveChangesAsync();
    }

    [Fact]
    public async Task FullHappyPath_InitiateConfirm_Succeeds()
    {
        await SeedUserAsync();

        _supplier.GetOfferByIdAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns(new HotelOffer
            {
                OfferId = "HTL-OFFER-1", HotelId = "HTL-001", Name = "Test Hotel",
                Address = "123 Test St", City = "Mumbai", Country = "India",
                StarRating = 4, PriceExpiryUtc = _fixedNow.AddMinutes(15),
                Rooms = new List<HotelRoomOffer>
                {
                    new() { RoomId = "RM-1", RoomType = "Deluxe", BoardType = "Bed & Breakfast",
                            PricePerNight = 5000m, TotalPrice = 15000m, TotalRoomsAvailable = 5,
                            CancellationPolicy = "Free cancellation 24hrs before" }
                }
            });

        _supplier.LockRateAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<HotelSearchCriteria>(), Arg.Any<CancellationToken>())
            .Returns(new FareLock { LockId = "LOCK-HTL-1", OfferId = "HTL-OFFER-1",
                LockedPrice = 15000m, Currency = "INR",
                LockedAtUtc = _fixedNow, ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10) });

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new InitiateHotelBookingCommandHandler(
                ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
            var result = await handler.Handle(
                new InitiateHotelBookingCommand("HTL-OFFER-1", "RM-1", 1,
                    new() { new() { FirstName = "Guest", LastName = "One" } }),
                CancellationToken.None);
            Assert.True(result.Succeeded, $"Initiate failed: {result.Error}");
            Assert.Equal(15000m, result.LockedPrice);
        }

        // Confirm with supplier
        _supplier.ConfirmBookingAsync(Arg.Any<FareLock>(), Arg.Any<List<TravelerInfo>>(), Arg.Any<CancellationToken>())
            .Returns(new ConfirmBookingResult(true, "HTL-REF-001", "SYS-HTL-1", "Confirmed", "/voucher/HTL-001", null));

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new ConfirmHotelBookingCommandHandler(
                ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
            var result = await handler.Handle(
                new ConfirmHotelBookingCommand("LOCK-HTL-1", "CreditCard", "txn-htl-001"),
                CancellationToken.None);
            Assert.True(result.Succeeded);
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var booking = await ctx.Bookings.FirstAsync(b => b.BookingType == BookingType.Hotel);
            Assert.Equal(BookingStatus.Confirmed, booking.Status);
            Assert.Equal(15000m, booking.PaidAmount);
        }
    }

    [Fact]
    public async Task Confirm_WithExpiredRateLock_ReturnsError()
    {
        await SeedUserAsync();
        _fareLockStore.Add(new FareLock { LockId = "LOCK-HTL-EXP", OfferId = "HTL-OFFER-X",
            LockedPrice = 10000m, Currency = "INR",
            LockedAtUtc = _fixedNow.AddHours(-1), ExpiresAtUtc = _fixedNow.AddMinutes(-1) });

        using var ctx = new ApplicationDbContext(_options);
        var handler = new ConfirmHotelBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
        var result = await handler.Handle(
            new ConfirmHotelBookingCommand("LOCK-HTL-EXP", "Wallet", null), CancellationToken.None);
        Assert.False(result.Succeeded);
        Assert.Contains("expired", result.Error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Confirm_WithWrongUserId_ReturnsBookingNotFound()
    {
        var otherUserId = Guid.NewGuid();
        _fareLockStore.Add(new FareLock { LockId = "LOCK-HTL-OTHER", OfferId = "HTL-OFFER-Y",
            LockedPrice = 8000m, Currency = "INR",
            LockedAtUtc = _fixedNow, ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10) });

        var bookingId = Guid.NewGuid();
        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Users.Add(new User { Id = otherUserId, Email = "other@test.com" });
            ctx.Bookings.Add(new Booking { Id = bookingId, UserId = otherUserId,
                BookingType = BookingType.Hotel, Status = BookingStatus.Pending, TotalAmount = 8000m });
            ctx.Set<HotelBookingDetail>().Add(new HotelBookingDetail { FareLockId = "LOCK-HTL-OTHER", BookingId = bookingId });
            await ctx.SaveChangesAsync();
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new ConfirmHotelBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
            var result = await handler.Handle(
                new ConfirmHotelBookingCommand("LOCK-HTL-OTHER", "Wallet", null), CancellationToken.None);
            Assert.False(result.Succeeded);
            Assert.Equal("Booking not found.", result.Error);
        }
    }

    [Fact]
    public async Task Confirm_CalledTwice_FirstSucceedsSecondFails()
    {
        await SeedUserAsync();
        _fareLockStore.Add(new FareLock { LockId = "LOCK-HTL-DBL", OfferId = "HTL-OFFER-Z",
            LockedPrice = 12000m, Currency = "INR",
            LockedAtUtc = DateTime.UtcNow, ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10) });

        _supplier.ConfirmBookingAsync(Arg.Any<FareLock>(), Arg.Any<List<TravelerInfo>>(), Arg.Any<CancellationToken>())
            .Returns(new ConfirmBookingResult(true, "HTL-REF-DBL", "SYS-DBL", "Confirmed", null, null));

        var bookingId = Guid.NewGuid();
        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Bookings.Add(new Booking { Id = bookingId, UserId = _userId,
                BookingType = BookingType.Hotel, Status = BookingStatus.Pending, TotalAmount = 12000m });
            ctx.Set<HotelBookingDetail>().Add(new HotelBookingDetail { FareLockId = "LOCK-HTL-DBL", BookingId = bookingId });
            await ctx.SaveChangesAsync();
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new ConfirmHotelBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
            var first = await handler.Handle(
                new ConfirmHotelBookingCommand("LOCK-HTL-DBL", "UPI", "txn-dbl"), CancellationToken.None);
            Assert.True(first.Succeeded);

            var second = await handler.Handle(
                new ConfirmHotelBookingCommand("LOCK-HTL-DBL", "UPI", "txn-dbl-2"), CancellationToken.None);
            Assert.False(second.Succeeded);
        }
    }

    [Fact]
    public async Task Confirm_SupplierFails_BookingMarkedFailed()
    {
        await SeedUserAsync();
        _fareLockStore.Add(new FareLock { LockId = "LOCK-HTL-FAIL", OfferId = "HTL-OFFER-F",
            LockedPrice = 9000m, Currency = "INR",
            LockedAtUtc = DateTime.UtcNow, ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10) });

        _supplier.ConfirmBookingAsync(Arg.Any<FareLock>(), Arg.Any<List<TravelerInfo>>(), Arg.Any<CancellationToken>())
            .Returns(new ConfirmBookingResult(false, null, null, null, null, "Hotel API unavailable"));

        var bookingId = Guid.NewGuid();
        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Bookings.Add(new Booking { Id = bookingId, UserId = _userId,
                BookingType = BookingType.Hotel, Status = BookingStatus.Pending, TotalAmount = 9000m });
            ctx.Set<HotelBookingDetail>().Add(new HotelBookingDetail { FareLockId = "LOCK-HTL-FAIL", BookingId = bookingId });
            await ctx.SaveChangesAsync();
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new ConfirmHotelBookingCommandHandler(ctx, _currentUser, _supplier, _fareLockStore, _dateTime);
            var result = await handler.Handle(
                new ConfirmHotelBookingCommand("LOCK-HTL-FAIL", "CreditCard", "txn-fail"), CancellationToken.None);
            Assert.False(result.Succeeded);
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var booking = await ctx.Bookings.FirstAsync(b => b.Id == bookingId);
            Assert.Equal(BookingStatus.Failed, booking.Status);
        }
    }
}
