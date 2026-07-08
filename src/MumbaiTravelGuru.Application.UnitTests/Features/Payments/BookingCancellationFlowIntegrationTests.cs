using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.Features.Payments.Commands;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;
using MumbaiTravelGuru.Infrastructure.Persistence;
using NSubstitute;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Features.Payments;

public class BookingCancellationFlowIntegrationTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly Guid _userId;
    private readonly ICurrentUserService _currentUser;
    private readonly IPaymentGateway _gateway;
    private readonly IDateTime _dateTime;
    private readonly DateTime _fixedNow;

    public BookingCancellationFlowIntegrationTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _userId = Guid.NewGuid();
        _fixedNow = new DateTime(2026, 7, 8, 10, 0, 0, DateTimeKind.Utc);

        _currentUser = Substitute.For<ICurrentUserService>();
        _currentUser.UserId.Returns(_userId);

        _gateway = Substitute.For<IPaymentGateway>();
        _dateTime = Substitute.For<IDateTime>();
        _dateTime.UtcNow.Returns(_fixedNow);
    }

    private async Task<Guid> SeedBookingAsync(BookingStatus status = BookingStatus.Pending,
        bool withPayment = false, decimal amount = 5000m)
    {
        var bookingId = Guid.NewGuid();
        using var ctx = new ApplicationDbContext(_options);
        ctx.Users.Add(new User { Id = _userId, Email = "cancel@test.com" });
        var booking = new Booking
        {
            Id = bookingId, UserId = _userId,
            BookingType = BookingType.Flight, Status = status,
            TotalAmount = amount, PaidAmount = withPayment ? amount : 0,
            Currency = "INR",
            CompletedAt = status == BookingStatus.Confirmed ? _fixedNow : null,
        };
        ctx.Bookings.Add(booking);

        if (withPayment)
        {
            ctx.Payments.Add(new Payment
            {
                BookingId = bookingId, UserId = _userId,
                Method = PaymentMethod.CreditCard, Status = PaymentStatus.Completed,
                Amount = amount, Currency = "INR",
                GatewayTransactionId = "gateway_txn_" + bookingId.ToString("N")[..8],
                ProcessedAt = _fixedNow,
            });
        }
        await ctx.SaveChangesAsync();
        return bookingId;
    }

    // ── Pending booking cancellation ───────────────────────────

    [Fact]
    public async Task CancelPendingBooking_NoPayment_NoRefundNeeded()
    {
        var bookingId = await SeedBookingAsync(BookingStatus.Pending, withPayment: false);

        using var ctx = new ApplicationDbContext(_options);
        var handler = new CancelBookingCommandHandler(ctx, _currentUser, _gateway, _dateTime);
        var result = await handler.Handle(
            new CancelBookingCommand(bookingId, "Changed mind"), CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal("NoRefundNeeded", result.RefundStatus);
        Assert.Equal(0m, result.RefundAmount);
    }

    // ── Confirmed booking with payment → refund ───────────────

    [Fact]
    public async Task CancelConfirmedBooking_ProcessesRefund()
    {
        var bookingId = await SeedBookingAsync(BookingStatus.Confirmed, withPayment: true, amount: 10000m);

        _gateway.ProcessRefundAsync(Arg.Any<RefundRequest>(), Arg.Any<CancellationToken>())
            .Returns(new RefundResponse { Succeeded = true, GatewayRefundId = "rfnd_001" });

        using var ctx = new ApplicationDbContext(_options);
        var handler = new CancelBookingCommandHandler(ctx, _currentUser, _gateway, _dateTime);
        var result = await handler.Handle(
            new CancelBookingCommand(bookingId, "Customer request"), CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal("RefundInitiated", result.RefundStatus);
        // Flight cancellation: 75% refund
        Assert.Equal(7500m, result.RefundAmount);
    }

    // ── Cancellation of already-cancelled booking ─────────────

    [Fact]
    public async Task CancelAlreadyCancelledBooking_ReturnsError()
    {
        var bookingId = await SeedBookingAsync(BookingStatus.Cancelled, withPayment: false);

        using var ctx = new ApplicationDbContext(_options);
        var handler = new CancelBookingCommandHandler(ctx, _currentUser, _gateway, _dateTime);
        var result = await handler.Handle(
            new CancelBookingCommand(bookingId, "Try again"), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal("Booking is already cancelled.", result.Error);
    }

    // ── Refund amounts vary by vertical ───────────────────────

    [Theory]
    [InlineData(BookingType.Flight, 10000, 7500)]    // 75%
    [InlineData(BookingType.Hotel, 10000, 9000)]     // 90% (daysUntilCheckin >= 7)
    [InlineData(BookingType.Package, 10000, 8000)]   // 80% (daysUntilDeparture >= 15)
    [InlineData(BookingType.Bus, 10000, 5000)]       // 50% (default fallback)
    public async Task CancelBooking_RefundPercentageByVertical(
        BookingType bookingType, decimal paidAmount, decimal expectedRefund)
    {
        var bookingId = Guid.NewGuid();
        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Users.Add(new User { Id = _userId, Email = "refund@test.com" });
            ctx.Bookings.Add(new Booking
            {
                Id = bookingId, UserId = _userId, BookingType = bookingType,
                Status = BookingStatus.Confirmed, TotalAmount = paidAmount,
                PaidAmount = paidAmount, Currency = "INR",
                CompletedAt = _fixedNow,
            });
            ctx.Payments.Add(new Payment
            {
                BookingId = bookingId, UserId = _userId,
                Method = PaymentMethod.UPI, Status = PaymentStatus.Completed,
                Amount = paidAmount, Currency = "INR",
                GatewayTransactionId = "txn_" + bookingId.ToString("N")[..8],
                ProcessedAt = _fixedNow,
            });
            await ctx.SaveChangesAsync();
        }

        _gateway.ProcessRefundAsync(Arg.Any<RefundRequest>(), Arg.Any<CancellationToken>())
            .Returns(new RefundResponse { Succeeded = true, GatewayRefundId = "rfnd_002" });

        using (var ctx2 = new ApplicationDbContext(_options))
        {
            var handler = new CancelBookingCommandHandler(ctx2, _currentUser, _gateway, _dateTime);
            var result = await handler.Handle(
                new CancelBookingCommand(bookingId, "Testing refund %"), CancellationToken.None);

            Assert.True(result.Succeeded);
            Assert.Equal("RefundInitiated", result.RefundStatus);
            Assert.Equal(expectedRefund, result.RefundAmount);
        }
    }

    // ── Gateway refund failure — refund marked Pending ────────

    [Fact]
    public async Task CancelBooking_GatewayFails_RefundMarkedPending()
    {
        var bookingId = await SeedBookingAsync(BookingStatus.Confirmed, withPayment: true, amount: 5000m);

        _gateway.ProcessRefundAsync(Arg.Any<RefundRequest>(), Arg.Any<CancellationToken>())
            .Returns(new RefundResponse { Succeeded = false, GatewayRefundId = null });

        using var ctx = new ApplicationDbContext(_options);
        var handler = new CancelBookingCommandHandler(ctx, _currentUser, _gateway, _dateTime);
        var result = await handler.Handle(
            new CancelBookingCommand(bookingId, "Refund test"), CancellationToken.None);

        // The booking is still cancelled, refund is marked Pending
        Assert.True(result.Succeeded);
        Assert.Equal("RefundPending", result.RefundStatus);
    }

    // ── Cancel someone else's booking ─────────────────────────

    [Fact]
    public async Task Cancel_AnotherUsersBooking_ThrowsBookingNotFound()
    {
        var otherUserId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Users.Add(new User { Id = otherUserId, Email = "other@test.com" });
            ctx.Bookings.Add(new Booking { Id = bookingId, UserId = otherUserId,
                BookingType = BookingType.Hotel, Status = BookingStatus.Pending,
                TotalAmount = 5000m, Currency = "INR" });
            await ctx.SaveChangesAsync();
        }

        using (var ctx2 = new ApplicationDbContext(_options))
        {
            var handler = new CancelBookingCommandHandler(ctx2, _currentUser, _gateway, _dateTime);
            var result = await handler.Handle(
                new CancelBookingCommand(bookingId, "Hacked cancel"), CancellationToken.None);

            // CancelBookingCommandHandler checks b.UserId == userId — correct security
            Assert.False(result.Succeeded);
        }
    }
}
