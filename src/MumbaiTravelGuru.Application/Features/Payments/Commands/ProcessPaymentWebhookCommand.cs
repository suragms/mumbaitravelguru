using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Payments.Commands;

public record ProcessPaymentWebhookCommand(string Payload, string Signature, string Secret) : IRequest<bool>;

public class ProcessPaymentWebhookCommandValidator : AbstractValidator<ProcessPaymentWebhookCommand>
{
    public ProcessPaymentWebhookCommandValidator()
    {
        RuleFor(v => v.Payload).NotEmpty();
        RuleFor(v => v.Signature).NotEmpty();
        RuleFor(v => v.Secret).NotEmpty();
    }
}

public class ProcessPaymentWebhookCommandHandler : IRequestHandler<ProcessPaymentWebhookCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentGateway _gateway;
    private readonly IFareLockStore _fareLockStore;
    private readonly IFlightSupplierAdapter _flightSupplier;
    private readonly IHotelSupplierAdapter _hotelSupplier;
    private readonly IDateTime _dateTime;

    public ProcessPaymentWebhookCommandHandler(
        IApplicationDbContext context, IPaymentGateway gateway,
        IFareLockStore fareLockStore, IFlightSupplierAdapter flightSupplier,
        IHotelSupplierAdapter hotelSupplier, IDateTime dateTime)
    {
        _context = context; _gateway = gateway; _fareLockStore = fareLockStore;
        _flightSupplier = flightSupplier; _hotelSupplier = hotelSupplier; _dateTime = dateTime;
    }

    public async Task<bool> Handle(ProcessPaymentWebhookCommand request, CancellationToken cancellationToken)
    {
        if (!_gateway.VerifyWebhookSignature(request.Payload, request.Signature, request.Secret))
            return false;

        var webhookEvent = _gateway.ParseWebhookEvent(request.Payload);
        if (webhookEvent == null)
            return false;

        var payment = await _context.Payments
            .Include(p => p.Booking)
            .FirstOrDefaultAsync(p => p.GatewayOrderId == webhookEvent.GatewayOrderId, cancellationToken);

        if (payment == null)
            return false;

        if (payment.Status != PaymentStatus.Pending)
            return true;

        if (webhookEvent.Status == "captured")
        {
            if (Math.Abs(payment.Amount - webhookEvent.Amount) > 0.01m)
                return false;

            payment.Status = PaymentStatus.Completed;
            payment.GatewayTransactionId = webhookEvent.GatewayTransactionId;
            payment.ProcessedAt = _dateTime.UtcNow;

            var booking = payment.Booking;
            booking.PaidAmount += payment.Amount;

            var confirmSucceeded = await ConfirmWithSupplier(booking, cancellationToken);

            if (confirmSucceeded)
            {
                if (booking.PaidAmount >= booking.TotalAmount)
                {
                    booking.Status = BookingStatus.Confirmed;
                }
            }
            else
            {
                booking.NeedsReconciliation = true;
                _context.AuditLogs.Add(new AuditLog
                {
                    Action = "ReconciliationFlagged",
                    UserId = booking.UserId,
                    Details = $"Payment captured but supplier confirmation failed. Booking:{booking.Id} GatewayTxn:{webhookEvent.GatewayTransactionId}",
                });
            }
        }
        else if (webhookEvent.Status == "failed")
        {
            payment.Status = PaymentStatus.Failed;
            payment.FailureReason = webhookEvent.FailureReason;
            payment.Booking.Status = BookingStatus.Failed;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<bool> ConfirmWithSupplier(Booking booking, CancellationToken cancellationToken)
    {
        try
        {
            if (booking.BookingType == BookingType.Flight)
            {
                var detail = await _context.Set<FlightBookingDetail>()
                    .Include(d => d.Passengers)
                    .FirstOrDefaultAsync(d => d.BookingId == booking.Id, cancellationToken);
                if (detail == null) return false;

                var fareLock = _fareLockStore.Get(detail.FareLockId);
                if (fareLock == null) return false;
                _fareLockStore.MarkUsed(detail.FareLockId);

                var travelers = detail.Passengers.Select(p => new TravelerInfo(
                    p.FirstName, p.LastName, p.PhoneNumber, p.Email,
                    p.DateOfBirth, p.Gender, p.PassportNumber, p.Nationality
                )).ToList();

                var result = await _flightSupplier.ConfirmBookingAsync(fareLock, travelers, cancellationToken);
                if (!result.Succeeded) return false;

                detail.ActionStatus = BookingActionStatus.Confirmed;
                detail.PnrNumber = result.PnrNumber;
                detail.TicketStatus = result.TicketStatus;
                detail.ETicketUrl = result.ETicketUrl;
                detail.SupplierLocator = result.SupplierLocator;
                booking.ConfirmationNumber = result.PnrNumber;
            }
            else if (booking.BookingType == BookingType.Hotel)
            {
                var detail = await _context.Set<HotelBookingDetail>()
                    .FirstOrDefaultAsync(d => d.BookingId == booking.Id, cancellationToken);
                if (detail == null) return false;

                var fareLock = _fareLockStore.Get(detail.FareLockId);
                if (fareLock == null) return false;
                _fareLockStore.MarkUsed(detail.FareLockId);

                var result = await _hotelSupplier.ConfirmBookingAsync(fareLock, new List<TravelerInfo>(), cancellationToken);
                if (!result.Succeeded) return false;

                detail.ActionStatus = "Confirmed";
                detail.BookingReference = result.PnrNumber;
                detail.VoucherUrl = result.ETicketUrl;
                booking.ConfirmationNumber = result.PnrNumber;
            }
            else if (booking.BookingType == BookingType.Package)
            {
                var detail = await _context.Set<PackageBookingDetail>()
                    .FirstOrDefaultAsync(d => d.BookingId == booking.Id, cancellationToken);
                if (detail == null) return false;

                detail.ActionStatus = "Confirmed";
                detail.BookingReference = $"PKG-{new Random().Next(1000000, 9999999)}";
                booking.ConfirmationNumber = detail.BookingReference;
            }

            booking.CompletedAt = _dateTime.UtcNow;

            _context.AuditLogs.Add(new AuditLog
            {
                Action = "BookingConfirmedViaWebhook",
                UserId = booking.UserId,
                Details = $"Booking {booking.Id} auto-confirmed after payment webhook.",
            });

            return true;
        }
        catch
        {
            return false;
        }
    }
}
