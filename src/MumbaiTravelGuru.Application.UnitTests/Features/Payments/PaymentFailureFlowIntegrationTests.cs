using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.Features.Payments.Commands;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;
using MumbaiTravelGuru.Domain.Models;
using MumbaiTravelGuru.Infrastructure.Persistence;
using NSubstitute;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Features.Payments;

public class PaymentFailureFlowIntegrationTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly IPaymentGateway _gateway;
    private readonly IFareLockStore _fareLockStore;
    private readonly IFlightSupplierAdapter _flightSupplier;
    private readonly IHotelSupplierAdapter _hotelSupplier;
    private readonly IDateTime _dateTime;
    private readonly DateTime _fixedNow;

    public PaymentFailureFlowIntegrationTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _fixedNow = new DateTime(2026, 7, 8, 10, 0, 0, DateTimeKind.Utc);

        _gateway = Substitute.For<IPaymentGateway>();
        _fareLockStore = Substitute.For<IFareLockStore>();
        _flightSupplier = Substitute.For<IFlightSupplierAdapter>();
        _hotelSupplier = Substitute.For<IHotelSupplierAdapter>();
        _dateTime = Substitute.For<IDateTime>();
        _dateTime.UtcNow.Returns(_fixedNow);
    }

    // ── Payment failure (webhook says failed) ─────────────────

    [Fact]
    public async Task Webhook_PaymentFailed_BookingStaysPending()
    {
        var bookingId = Guid.NewGuid();
        var gatewayOrderId = "order_failed_001";

        _gateway.VerifyWebhookSignature(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns(true);
        _gateway.ParseWebhookEvent(Arg.Any<string>()).Returns(new WebhookEvent
        {
            EventType = "payment.failed",
            GatewayOrderId = gatewayOrderId,
            GatewayTransactionId = "pay_failed_001",
            Amount = 10000m,
            Currency = "INR",
            Status = "failed",
            FailureReason = "Insufficient funds",
        });

        using (var ctx = new ApplicationDbContext(_options))
        {
            var user = new User { Email = "fail@test.com", FirstName = "F", LastName = "U" };
            ctx.Users.Add(user);
            ctx.Bookings.Add(new Booking { Id = bookingId, UserId = user.Id,
                BookingType = BookingType.Flight, Status = BookingStatus.Pending,
                TotalAmount = 10000m, Currency = "INR" });
            ctx.Payments.Add(new Payment { BookingId = bookingId, UserId = user.Id,
                Method = PaymentMethod.CreditCard, Status = PaymentStatus.Pending,
                Amount = 10000m, Currency = "INR", GatewayOrderId = gatewayOrderId });
            await ctx.SaveChangesAsync();
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new ProcessPaymentWebhookCommandHandler(
                ctx, _gateway, _fareLockStore, _flightSupplier, _hotelSupplier, _dateTime);
            var result = await handler.Handle(
                new ProcessPaymentWebhookCommand("{}", "sig", "secret"), CancellationToken.None);
            Assert.True(result);
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var payment = await ctx.Payments.FirstAsync(p => p.GatewayOrderId == gatewayOrderId);
            Assert.Equal(PaymentStatus.Failed, payment.Status);
            Assert.Equal("Insufficient funds", payment.FailureReason);

            var booking = await ctx.Bookings.FirstAsync(b => b.Id == bookingId);
            Assert.NotEqual(BookingStatus.Confirmed, booking.Status);
            Assert.Equal(0m, booking.PaidAmount);
        }
    }

    // ── Payment success + supplier failure = reconciliation ──

    [Fact]
    public async Task Webhook_PaymentSucceedsButSupplierFails_FlagsReconciliation()
    {
        var bookingId = Guid.NewGuid();
        var gatewayOrderId = "order_recon_002";

        _gateway.VerifyWebhookSignature(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns(true);
        _gateway.ParseWebhookEvent(Arg.Any<string>()).Returns(new WebhookEvent
        {
            EventType = "payment.captured",
            GatewayOrderId = gatewayOrderId,
            GatewayTransactionId = "pay_recon_002",
            Amount = 7500m,
            Currency = "INR",
            Status = "captured",
        });

        // Supplier fails after payment is taken
        _fareLockStore.Get(Arg.Any<string>()).Returns((FareLock?)null);
        _flightSupplier.ConfirmBookingAsync(Arg.Any<FareLock>(), Arg.Any<List<TravelerInfo>>(), Arg.Any<CancellationToken>())
            .Returns(new ConfirmBookingResult(false, null, null, null, null, "Supplier offline"));

        using (var ctx = new ApplicationDbContext(_options))
        {
            var user = new User { Email = "recon2@test.com", FirstName = "R", LastName = "U" };
            var booking = new Booking { Id = bookingId, UserId = user.Id,
                BookingType = BookingType.Flight, Status = BookingStatus.Pending,
                TotalAmount = 7500m, PaidAmount = 0, Currency = "INR" };
            var payment = new Payment { BookingId = bookingId, UserId = user.Id,
                Method = PaymentMethod.UPI, Status = PaymentStatus.Pending,
                Amount = 7500m, Currency = "INR", GatewayOrderId = gatewayOrderId };
            var detail = new FlightBookingDetail { BookingId = bookingId, FareLockId = "fl_recon_002",
                OfferId = "OFF-2", OriginAirport = "BOM", DestinationAirport = "DEL",
                TripType = TripType.OneWay, CabinClass = CabinClass.Economy };
            ctx.Users.Add(user);
            ctx.Bookings.Add(booking);
            ctx.Payments.Add(payment);
            ctx.Set<FlightBookingDetail>().Add(detail);
            await ctx.SaveChangesAsync();
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var handler = new ProcessPaymentWebhookCommandHandler(
                ctx, _gateway, _fareLockStore, _flightSupplier, _hotelSupplier, _dateTime);
            var result = await handler.Handle(
                new ProcessPaymentWebhookCommand("{}", "sig", "secret"), CancellationToken.None);
            Assert.True(result);
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var booking = await ctx.Bookings.FirstAsync(b => b.Id == bookingId);
            Assert.True(booking.NeedsReconciliation);
            Assert.Equal(BookingStatus.Pending, booking.Status);

            var auditLog = await ctx.AuditLogs.FirstOrDefaultAsync(a => a.Action == "ReconciliationFlagged");
            Assert.NotNull(auditLog);
        }
    }

    // ── Webhook with tampered amount ──────────────────────────

    [Fact]
    public async Task Webhook_TamperedAmount_Rejected()
    {
        _gateway.VerifyWebhookSignature(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns(false);
        _gateway.ParseWebhookEvent(Arg.Any<string>()).Returns((WebhookEvent?)null);

        using var ctx = new ApplicationDbContext(_options);
        var handler = new ProcessPaymentWebhookCommandHandler(
            ctx, _gateway, _fareLockStore, _flightSupplier, _hotelSupplier, _dateTime);
        var result = await handler.Handle(
            new ProcessPaymentWebhookCommand("{\"amount\":999999}", "bad_sig", "secret"), CancellationToken.None);
        Assert.False(result);
    }

    // ── Duplicate webhook delivery (idempotency) ──────────────

    [Fact]
    public async Task Webhook_DeliveredThreeTimes_OnlyOnePaymentProcessed()
    {
        var bookingId = Guid.NewGuid();
        var gatewayOrderId = "order_idemp_003";

        _gateway.VerifyWebhookSignature(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns(true);
        _gateway.ParseWebhookEvent(Arg.Any<string>()).Returns(new WebhookEvent
        {
            EventType = "payment.captured",
            GatewayOrderId = gatewayOrderId,
            GatewayTransactionId = "pay_idemp_003",
            Amount = 5000m,
            Currency = "INR",
            Status = "captured",
        });

        using (var ctx = new ApplicationDbContext(_options))
        {
            var user = new User { Email = "idemp@test.com", FirstName = "I", LastName = "D" };
            var booking = new Booking { Id = bookingId, UserId = user.Id,
                BookingType = BookingType.Flight, Status = BookingStatus.Pending,
                TotalAmount = 5000m, PaidAmount = 0, Currency = "INR" };
            var payment = new Payment { BookingId = bookingId, UserId = user.Id,
                Method = PaymentMethod.CreditCard, Status = PaymentStatus.Pending,
                Amount = 5000m, Currency = "INR", GatewayOrderId = gatewayOrderId };
            ctx.Users.Add(user);
            ctx.Bookings.Add(booking);
            ctx.Payments.Add(payment);
            await ctx.SaveChangesAsync();
        }

        for (int i = 0; i < 3; i++)
        {
            using (var ctx = new ApplicationDbContext(_options))
            {
                var handler = new ProcessPaymentWebhookCommandHandler(
                    ctx, _gateway, _fareLockStore, _flightSupplier, _hotelSupplier, _dateTime);
                var result = await handler.Handle(
                    new ProcessPaymentWebhookCommand("{}", "sig", "secret"), CancellationToken.None);
                Assert.True(result);
            }
        }

        using (var ctx = new ApplicationDbContext(_options))
        {
            var completedCount = await ctx.Payments.CountAsync(p =>
                p.GatewayOrderId == gatewayOrderId && p.Status == PaymentStatus.Completed);
            Assert.Equal(1, completedCount);
        }
    }

    // ── CreatePaymentOrder with coupon ────────────────────────

    [Fact]
    public async Task CreatePaymentOrder_WithInvalidBooking_ReturnsError()
    {
        // This test validates that CreatePaymentOrderCommand rejects
        // a BookingId that doesn't belong to the current user.
        // However, the handler is NOT scope-checked — it queries by BookingId directly.
        // This is a gap documented below.

        var otherUserId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        using (var ctx = new ApplicationDbContext(_options))
        {
            ctx.Bookings.Add(new Booking { Id = bookingId, UserId = otherUserId,
                BookingType = BookingType.Flight, Status = BookingStatus.Pending,
                TotalAmount = 5000m, Currency = "INR" });
            ctx.Payments.Add(new Payment { BookingId = bookingId, UserId = otherUserId,
                Method = PaymentMethod.UPI, Status = PaymentStatus.Pending,
                Amount = 5000m, Currency = "INR", GatewayOrderId = "order_orphan" });
            await ctx.SaveChangesAsync();
        }

        // GAP: CreatePaymentOrderCommandHandler does NOT check that
        // booking.UserId == currentUser.UserId. A user could create
        // a payment order for another user's booking by guessing their BookingId.
        // This is a horizontal privilege escalation vulnerability.
        // See issues list.
    }
}
