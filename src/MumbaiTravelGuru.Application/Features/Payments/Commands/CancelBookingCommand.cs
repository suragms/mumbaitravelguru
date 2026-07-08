using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Payments.Commands;

public record CancelBookingResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public decimal RefundAmount { get; set; }
    public string? GatewayRefundId { get; set; }
    public string? RefundStatus { get; set; }
}

public record CancelBookingCommand(Guid BookingId, string? Reason) : IRequest<CancelBookingResult>;

public class CancelBookingCommandValidator : AbstractValidator<CancelBookingCommand>
{
    public CancelBookingCommandValidator() => RuleFor(v => v.BookingId).NotEmpty();
}

public class CancelBookingCommandHandler : IRequestHandler<CancelBookingCommand, CancelBookingResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IPaymentGateway _gateway;
    private readonly IDateTime _dateTime;

    public CancelBookingCommandHandler(
        IApplicationDbContext context, ICurrentUserService currentUser,
        IPaymentGateway gateway, IDateTime dateTime)
    {
        _context = context; _currentUser = currentUser; _gateway = gateway; _dateTime = dateTime;
    }

    public async Task<CancelBookingResult> Handle(CancelBookingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException("User not authenticated.");

        var booking = await _context.Bookings
            .Include(b => b.Payments)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

        if (booking == null)
            return new CancelBookingResult { Succeeded = false, Error = "Booking not found." };

        if (booking.UserId != userId)
            return new CancelBookingResult { Succeeded = false, Error = "Booking not found." };

        if (booking.Status == BookingStatus.Cancelled)
            return new CancelBookingResult { Succeeded = false, Error = "Booking is already cancelled." };

        if (booking.Status == BookingStatus.Pending)
        {
            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = request.Reason;
            booking.CancelledAt = _dateTime.UtcNow;

            _context.AuditLogs.Add(new AuditLog
            {
                Action = "BookingCancelled",
                UserId = userId,
                Details = $"Pending booking {booking.Id} cancelled. No payment to refund.",
            });

            await _context.SaveChangesAsync(cancellationToken);
            return new CancelBookingResult { Succeeded = true, RefundAmount = 0, RefundStatus = "NoRefundNeeded" };
        }

        if (booking.Status != BookingStatus.Confirmed)
            return new CancelBookingResult { Succeeded = false, Error = "Booking cannot be cancelled in its current state." };

        var completedPayments = booking.Payments
            .Where(p => p.Status == PaymentStatus.Completed)
            .ToList();

        if (completedPayments.Count == 0)
        {
            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = request.Reason;
            booking.CancelledAt = _dateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
            return new CancelBookingResult { Succeeded = true, RefundAmount = 0, RefundStatus = "NoRefundNeeded" };
        }

        var refundAmount = ComputeRefundAmount(booking, booking.TotalAmount);
        if (refundAmount <= 0)
        {
            booking.Status = BookingStatus.Cancelled;
            booking.CancellationReason = request.Reason;
            booking.CancelledAt = _dateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
            return new CancelBookingResult { Succeeded = true, RefundAmount = 0, RefundStatus = "NonRefundable" };
        }

        var totalRefundedAmount = 0m;
        var anyRefundAttempted = false;
        foreach (var payment in completedPayments)
        {
            if (string.IsNullOrEmpty(payment.GatewayTransactionId))
                continue;

            var requestAmount = refundAmount > payment.Amount ? payment.Amount : refundAmount;
            var refundRequest = new RefundRequest
            {
                GatewayTransactionId = payment.GatewayTransactionId,
                Amount = requestAmount,
                Reason = request.Reason ?? "Customer requested cancellation",
            };

            var refundResponse = await _gateway.ProcessRefundAsync(refundRequest, cancellationToken);

            var refund = new Refund
            {
                PaymentId = payment.Id,
                BookingId = booking.Id,
                UserId = userId,
                Amount = requestAmount,
                Currency = payment.Currency,
                Status = refundResponse.Succeeded ? RefundStatus.Processed : RefundStatus.Pending,
                Reason = refundRequest.Reason,
                GatewayRefundId = refundResponse.GatewayRefundId,
                ProcessedAt = refundResponse.Succeeded ? _dateTime.UtcNow : null,
            };
            _context.Refunds.Add(refund);
            anyRefundAttempted = true;

            if (refundResponse.Succeeded)
            {
                payment.Status = PaymentStatus.Refunded;
                totalRefundedAmount += requestAmount;
            }

            refundAmount -= requestAmount;
            if (refundAmount <= 0) break;
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancellationReason = request.Reason;
        booking.CancelledAt = _dateTime.UtcNow;

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "BookingCancelledWithRefund",
            UserId = userId,
            Details = $"Booking {booking.Id} cancelled. Refund initiated: {refundAmount}",
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new CancelBookingResult
        {
            Succeeded = true,
            RefundAmount = totalRefundedAmount,
            RefundStatus = totalRefundedAmount > 0 ? "RefundInitiated" : anyRefundAttempted ? "RefundPending" : "NoRefundNeeded",
        };
    }

    private static decimal ComputeRefundAmount(Booking booking, decimal totalPaid)
    {
        if (totalPaid <= 0) return 0;

        if (booking.BookingType == BookingType.Flight)
            return totalPaid * 0.75m;

        if (booking.BookingType == BookingType.Hotel)
        {
            var daysUntilCheckIn = 14;
            if (daysUntilCheckIn >= 7) return totalPaid * 0.90m;
            if (daysUntilCheckIn >= 2) return totalPaid * 0.50m;
            return 0;
        }

        if (booking.BookingType == BookingType.Package)
        {
            var daysUntilDeparture = 30;
            if (daysUntilDeparture >= 15) return totalPaid * 0.80m;
            if (daysUntilDeparture >= 7) return totalPaid * 0.50m;
            return 0;
        }

        return totalPaid * 0.50m;
    }
}
