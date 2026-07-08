using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Behaviours;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Admin.Commands;

[AdminAction("AdminCancelBooking", "Admin cancelled a booking", EntityType = "Booking", EntityIdProperty = "BookingId", LogRequest = true)]
public record AdminCancelBookingCommand(Guid BookingId, string? Reason) : IRequest<AdminCancelBookingResult>;

public class AdminCancelBookingResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public decimal RefundAmount { get; set; }
    public string? RefundStatus { get; set; }
}

public class AdminCancelBookingCommandValidator : AbstractValidator<AdminCancelBookingCommand>
{
    public AdminCancelBookingCommandValidator() => RuleFor(v => v.BookingId).NotEmpty();
}

public class AdminCancelBookingCommandHandler : IRequestHandler<AdminCancelBookingCommand, AdminCancelBookingResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IPaymentGateway _gateway;
    private readonly IDateTime _dateTime;

    public AdminCancelBookingCommandHandler(IApplicationDbContext context, IPaymentGateway gateway, IDateTime dateTime)
    {
        _context = context; _gateway = gateway; _dateTime = dateTime;
    }

    public async Task<AdminCancelBookingResult> Handle(AdminCancelBookingCommand request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .Include(b => b.Payments)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && !b.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Booking not found.");

        if (booking.Status == BookingStatus.Cancelled)
            return new AdminCancelBookingResult { Succeeded = false, Error = "Already cancelled." };

        booking.Status = BookingStatus.Cancelled;
        booking.CancellationReason = request.Reason ?? "Cancelled by admin";
        booking.CancelledAt = _dateTime.UtcNow;

        var completedPayments = booking.Payments.Where(p => p.Status == PaymentStatus.Completed).ToList();
        decimal totalRefunded = 0;

        foreach (var payment in completedPayments)
        {
            if (string.IsNullOrEmpty(payment.GatewayTransactionId)) continue;

            var refundAmount = payment.Amount;
            var refundResponse = await _gateway.ProcessRefundAsync(new RefundRequest
            {
                GatewayTransactionId = payment.GatewayTransactionId,
                Amount = refundAmount,
                Reason = request.Reason ?? "Admin initiated cancellation",
            }, cancellationToken);

            _context.Refunds.Add(new Refund
            {
                PaymentId = payment.Id, BookingId = booking.Id, UserId = booking.UserId,
                Amount = refundAmount, Currency = payment.Currency,
                Status = refundResponse.Succeeded ? RefundStatus.Processed : RefundStatus.Pending,
                Reason = request.Reason, GatewayRefundId = refundResponse.GatewayRefundId,
                ProcessedAt = refundResponse.Succeeded ? _dateTime.UtcNow : null,
            });

            if (refundResponse.Succeeded)
            {
                payment.Status = PaymentStatus.Refunded;
                totalRefunded += refundAmount;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return new AdminCancelBookingResult { Succeeded = true, RefundAmount = totalRefunded, RefundStatus = totalRefunded > 0 ? "Refunded" : "NoRefund" };
    }
}
