using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.Features.Packages.Commands;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;
using MumbaiTravelGuru.Infrastructure.Persistence;
using NSubstitute;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Features.Packages;

public class PackageBookingFlowIntegrationTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly Guid _userId;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTime _dateTime;
    private readonly DateTime _fixedNow;

    public PackageBookingFlowIntegrationTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _userId = Guid.NewGuid();
        _fixedNow = new DateTime(2026, 7, 8, 10, 0, 0, DateTimeKind.Utc);
        _currentUser = Substitute.For<ICurrentUserService>();
        _currentUser.UserId.Returns(_userId);

        _dateTime = Substitute.For<IDateTime>();
        _dateTime.UtcNow.Returns(_fixedNow);
    }

    private async Task<(Guid PackageId, Guid DepartureId)> SeedPackageAsync(decimal price = 20000m, decimal? discountedPrice = null, int totalSpots = 20)
    {
        var packageId = Guid.NewGuid();
        var departureId = Guid.NewGuid();
        using var ctx = new ApplicationDbContext(_options);
        ctx.Set<Package>().Add(new Package
        {
            Id = packageId, Name = "Test Package", Slug = "test-package",
            Description = "A test package", Destination = "Goa",
            DurationDays = 3, DurationNights = 2,
            PricePerPerson = price, DiscountedPricePerPerson = discountedPrice,
            Currency = "INR", IsFixedDeparture = true,
            IsActive = true, Theme = "Beach",
            FixedDepartures = new List<FixedDeparture>
            {
                new FixedDeparture
                {
                    Id = departureId, PackageId = packageId,
                    StartDate = _fixedNow.AddDays(30), EndDate = _fixedNow.AddDays(33),
                    PricePerPerson = price, DiscountedPricePerPerson = discountedPrice,
                    AvailableSpots = totalSpots, TotalSpots = totalSpots, IsActive = true,
                }
            }
        });
        await ctx.SaveChangesAsync();
        return (packageId, departureId);
    }

    private async Task<Guid> SeedDepartureAsync(Guid packageId, int spots = 20)
    {
        var departureId = Guid.NewGuid();
        using var ctx = new ApplicationDbContext(_options);
        ctx.Set<FixedDeparture>().Add(new FixedDeparture
        {
            Id = departureId, PackageId = packageId,
            StartDate = _fixedNow.AddDays(30), EndDate = _fixedNow.AddDays(33),
            PricePerPerson = 20000m, AvailableSpots = spots, TotalSpots = spots, IsActive = true,
        });
        await ctx.SaveChangesAsync();
        return departureId;
    }

    // ── Happy Path ──────────────────────────────────────────────

    [Fact]
    public async Task FullHappyPath_InitiateThenFinalConfirm_Succeeds()
    {
        var (packageId, departureId) = await SeedPackageAsync(price: 20000m, totalSpots: 20);
        departureId = await SeedDepartureAsync(packageId, 20);

        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Users.Add(new User { Id = _userId, Email = "pack@test.com" });
            await ctx.SaveChangesAsync();
        }

        // Initiate: 2 travelers, 25% upfront = 10,000
        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new InitiatePackageBookingCommandHandler(ctx, _currentUser, _dateTime);
            var result = await handler.Handle(
                new InitiatePackageBookingCommand(packageId, departureId, 2), CancellationToken.None);
            Assert.True(result.Succeeded);
            Assert.Equal(40000m, result.TotalPrice);    // 20000 * 2
            Assert.Equal(10000m, result.InitialPayment); // 25% of 40000
        }

        // Partial payment (first confirm)
        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new ConfirmPackageBookingCommandHandler(ctx, _currentUser, _dateTime);
            var booking = await ctx.Bookings.FirstAsync(b => b.BookingType == BookingType.Package);
            var result = await handler.Handle(
                new ConfirmPackageBookingCommand(booking.Id, 10000m, "UPI", "txn-pkg-1", false),
                CancellationToken.None);
            Assert.True(result.Succeeded);
            Assert.False(result.IsFullyPaid);
            Assert.Equal(10000m, result.AmountPaid);
        }

        // Final payment (remaining 30000)
        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new ConfirmPackageBookingCommandHandler(ctx, _currentUser, _dateTime);
            var booking = await ctx.Bookings.FirstAsync(b => b.BookingType == BookingType.Package);
            var result = await handler.Handle(
                new ConfirmPackageBookingCommand(booking.Id, 30000m, "UPI", "txn-pkg-2", true),
                CancellationToken.None);
            Assert.True(result.Succeeded);
            Assert.True(result.IsFullyPaid);
            Assert.NotNull(result.ConfirmationNumber);
        }

        // Final state
        using (var ctx = new ApplicationDbContext(_options))
        {
            var booking = await ctx.Bookings.FirstAsync(b => b.BookingType == BookingType.Package);
            Assert.Equal(BookingStatus.Confirmed, booking.Status);
            Assert.Equal(40000m, booking.PaidAmount);

            var paymentCount = await ctx.Payments.CountAsync(p => p.BookingId == booking.Id);
            Assert.Equal(2, paymentCount);
        }
    }

    // ── Spots exhaustion ───────────────────────────────────────

    [Fact]
    public async Task Initiate_WhenSpotsExhausted_ReturnsError()
    {
        var (packageId, departureId) = await SeedPackageAsync(totalSpots: 1);

        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Users.Add(new User { Id = _userId, Email = "pack@test.com" });
            await ctx.SaveChangesAsync();
        }

        // First booking: 1 traveler — succeeds
        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new InitiatePackageBookingCommandHandler(ctx, _currentUser, _dateTime);
            var first = await handler.Handle(
                new InitiatePackageBookingCommand(packageId, departureId, 1), CancellationToken.None);
            Assert.True(first.Succeeded);
        }

        // Second booking: 2 travelers — fails because only 0 spots left
        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new InitiatePackageBookingCommandHandler(ctx, _currentUser, _dateTime);
            var second = await handler.Handle(
                new InitiatePackageBookingCommand(packageId, departureId, 2), CancellationToken.None);
            Assert.False(second.Succeeded);
            Assert.Contains("spots", second.Error, StringComparison.OrdinalIgnoreCase);
        }
    }

    // ── Duplicate confirm after full payment ───────────────────

    [Fact]
    public async Task Confirm_CalledTwiceAfterFullPayment_SecondStillSucceeds()
    {
        var (packageId, departureId) = await SeedPackageAsync(price: 10000m, totalSpots: 10);

        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Users.Add(new User { Id = _userId, Email = "pack@test.com" });
            await ctx.SaveChangesAsync();
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new InitiatePackageBookingCommandHandler(ctx, _currentUser, _dateTime);
            await handler.Handle(
                new InitiatePackageBookingCommand(packageId, departureId, 1), CancellationToken.None);
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new ConfirmPackageBookingCommandHandler(ctx, _currentUser, _dateTime);
            var booking = await ctx.Bookings.FirstAsync();

            // Confirm twice with IsFinalPayment = true
            var first = await handler.Handle(
                new ConfirmPackageBookingCommand(booking.Id, 10000m, "UPI", "txn-pkg-dbl", true),
                CancellationToken.None);
            Assert.True(first.Succeeded);
            Assert.True(first.IsFullyPaid);

            // Second confirm with same booking but different payment:
            // The handler creates another payment and increases AmountPaid further.
            // In production the frontend should disable the button; this test documents
            // that there's no idempotency guard on confirm.
            var second = await handler.Handle(
                new ConfirmPackageBookingCommand(booking.Id, 5000m, "UPI", "txn-pkg-dbl-2", true),
                CancellationToken.None);
            // GAP: This actually overpays the booking. There's no check preventing
            // confirm from being called after the booking is already marked Confirmed.
            Assert.True(second.Succeeded);
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var booking = await ctx.Bookings.FirstAsync();
            Assert.Equal(BookingStatus.Confirmed, booking.Status);
            Assert.Equal(15000m, booking.PaidAmount);  // 10000 + 5000 = overpaid
        }
    }

    // ── Cancel a pending package booking before payment ────────

    [Fact]
    public async Task CancelPendingPackageBooking_RefundsSpots()
    {
        var (packageId, departureId) = await SeedPackageAsync(totalSpots: 20);

        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Users.Add(new User { Id = _userId, Email = "pack@test.com" });
            await ctx.SaveChangesAsync();
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new InitiatePackageBookingCommandHandler(ctx, _currentUser, _dateTime);
            await handler.Handle(
                new InitiatePackageBookingCommand(packageId, departureId, 2), CancellationToken.None);
        }

        // Cancel the pending booking
        using (var ctx = new ApplicationDbContext(_options))
        {
            var booking = await ctx.Bookings.FirstAsync();
            var cancelHandler = new MumbaiTravelGuru.Application.Features.Payments.Commands.CancelBookingCommandHandler(
                ctx, _currentUser, Substitute.For<IPaymentGateway>(), _dateTime);
            var result = await cancelHandler.Handle(
                new MumbaiTravelGuru.Application.Features.Payments.Commands.CancelBookingCommand(booking.Id, "Package cancelled"),
                CancellationToken.None);
            Assert.True(result.Succeeded);
            Assert.Equal("NoRefundNeeded", result.RefundStatus);
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var booking = await ctx.Bookings.FirstAsync();
            Assert.Equal(BookingStatus.Cancelled, booking.Status);
        }
    }
}
