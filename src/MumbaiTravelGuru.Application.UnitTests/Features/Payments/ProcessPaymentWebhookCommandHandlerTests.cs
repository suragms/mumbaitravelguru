using System;
using System.Collections.Generic;
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

public class ProcessPaymentWebhookCommandHandlerTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly IPaymentGateway _gateway;
    private readonly IFareLockStore _fareLockStore;
    private readonly IFlightSupplierAdapter _flightSupplier;
    private readonly IHotelSupplierAdapter _hotelSupplier;
    private readonly IDateTime _dateTime;

    public ProcessPaymentWebhookCommandHandlerTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _gateway = Substitute.For<IPaymentGateway>();
        _fareLockStore = Substitute.For<IFareLockStore>();
        _flightSupplier = Substitute.For<IFlightSupplierAdapter>();
        _hotelSupplier = Substitute.For<IHotelSupplierAdapter>();
        _dateTime = Substitute.For<IDateTime>();
        _dateTime.UtcNow.Returns(DateTime.UtcNow);
    }

    [Fact]
    public async Task Handle_DuplicateWebhookDelivery_ShouldBeIdempotent()
    {
        var bookingId = Guid.NewGuid();
        var gatewayOrderId = "order_DuplicateTest";

        _gateway.VerifyWebhookSignature(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns(true);
        _gateway.ParseWebhookEvent(Arg.Any<string>()).Returns(new WebhookEvent
        {
            EventType = "payment.captured",
            GatewayOrderId = gatewayOrderId,
            GatewayTransactionId = "pay_DuplicateTxn",
            Amount = 10000m,
            Currency = "INR",
            Status = "captured",
        });

        using (var context = new ApplicationDbContext(_options))
        {
            var user = new User { Email = "test@test.com", FirstName = "T", LastName = "U" };
            var booking = new Booking
            {
                Id = bookingId,
                User = user,
                UserId = user.Id,
                BookingType = BookingType.Flight,
                Status = BookingStatus.Pending,
                TotalAmount = 10000m,
                PaidAmount = 0,
                Currency = "INR",
            };
            var payment = new Payment
            {
                BookingId = bookingId,
                UserId = user.Id,
                Method = PaymentMethod.CreditCard,
                Status = PaymentStatus.Pending,
                Amount = 10000m,
                Currency = "INR",
                GatewayOrderId = gatewayOrderId,
            };
            context.Users.Add(user);
            context.Bookings.Add(booking);
            context.Payments.Add(payment);
            await context.SaveChangesAsync();
        }

        for (int i = 0; i < 3; i++)
        {
            using (var context = new ApplicationDbContext(_options))
            {
                var handler = new ProcessPaymentWebhookCommandHandler(
                    context, _gateway, _fareLockStore, _flightSupplier, _hotelSupplier, _dateTime);
                var result = await handler.Handle(
                    new ProcessPaymentWebhookCommand("{}", "sig", "secret"), CancellationToken.None);
                Assert.True(result);
            }
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var payment = await context.Payments.FirstOrDefaultAsync(p => p.GatewayOrderId == gatewayOrderId);
            Assert.NotNull(payment);
            Assert.Equal(PaymentStatus.Completed, payment.Status);

            var completedCount = await context.Payments.CountAsync(p =>
                p.GatewayOrderId == gatewayOrderId && p.Status == PaymentStatus.Completed);
            Assert.Equal(1, completedCount);
        }
    }

    [Fact]
    public async Task Handle_PaymentSuccessWithSupplierFailure_ShouldFlagReconciliation()
    {
        var bookingId = Guid.NewGuid();
        var gatewayOrderId = "order_ReconTest";

        _gateway.VerifyWebhookSignature(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>()).Returns(true);
        _gateway.ParseWebhookEvent(Arg.Any<string>()).Returns(new WebhookEvent
        {
            EventType = "payment.captured",
            GatewayOrderId = gatewayOrderId,
            GatewayTransactionId = "pay_ReconTxn",
            Amount = 5000m,
            Currency = "INR",
            Status = "captured",
        });

        _flightSupplier.ConfirmBookingAsync(Arg.Any<FareLock>(), Arg.Any<List<TravelerInfo>>(), Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(new ConfirmBookingResult(false, null, null, null, null, "Supplier system unavailable")));

        using (var context = new ApplicationDbContext(_options))
        {
            var user = new User { Email = "recon@test.com", FirstName = "R", LastName = "U" };
            var booking = new Booking
            {
                Id = bookingId,
                User = user,
                UserId = user.Id,
                BookingType = BookingType.Flight,
                Status = BookingStatus.Pending,
                TotalAmount = 5000m,
                PaidAmount = 0,
                Currency = "INR",
            };
            var payment = new Payment
            {
                BookingId = bookingId, UserId = user.Id,
                Method = PaymentMethod.CreditCard, Status = PaymentStatus.Pending,
                Amount = 5000m, Currency = "INR", GatewayOrderId = gatewayOrderId,
            };
            var detail = new FlightBookingDetail
            {
                BookingId = bookingId, FareLockId = "fl_recon",
                OfferId = "OFF-1", OriginAirport = "BOM", DestinationAirport = "DEL",
                TripType = TripType.OneWay, CabinClass = CabinClass.Economy,
            };
            context.Users.Add(user);
            context.Bookings.Add(booking);
            context.Payments.Add(payment);
            context.Set<FlightBookingDetail>().Add(detail);
            await context.SaveChangesAsync();
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new ProcessPaymentWebhookCommandHandler(
                context, _gateway, _fareLockStore, _flightSupplier, _hotelSupplier, _dateTime);
            var result = await handler.Handle(
                new ProcessPaymentWebhookCommand("{}", "sig", "secret"), CancellationToken.None);
            Assert.True(result);
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var booking = await context.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId);
            Assert.NotNull(booking);
            Assert.True(booking.NeedsReconciliation, "Booking should be flagged for reconciliation when payment succeeds but supplier fails.");

            var auditLogs = await context.AuditLogs
                .Where(a => a.Action == "ReconciliationFlagged" && a.UserId == booking.UserId)
                .ToListAsync();
            Assert.NotEmpty(auditLogs);
            Assert.Contains(auditLogs, log => log.Details.Contains(bookingId.ToString()));
        }
    }

    [Fact]
    public async Task Handle_TamperedWebhookAmount_ShouldBeRejectedBySignatureVerification()
    {
        var payload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_tampered\",\"amount\":500000,\"currency\":\"INR\",\"status\":\"captured\"}},\"order\":{\"entity\":{\"id\":\"order_tampered\"}}}}";
        var tamperedPayload = payload.Replace("500000", "500001");
        var signature = "fake_signature";
        var secret = "test_secret";

        _gateway.VerifyWebhookSignature(tamperedPayload, signature, secret).Returns(false);
        _gateway.ParseWebhookEvent(Arg.Any<string>()).Returns((WebhookEvent?)null);

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new ProcessPaymentWebhookCommandHandler(
                context, _gateway, _fareLockStore, _flightSupplier, _hotelSupplier, _dateTime);
            var result = await handler.Handle(
                new ProcessPaymentWebhookCommand(tamperedPayload, signature, secret), CancellationToken.None);
            Assert.False(result, "Tampered webhook with invalid signature must be rejected.");
        }
    }
}
