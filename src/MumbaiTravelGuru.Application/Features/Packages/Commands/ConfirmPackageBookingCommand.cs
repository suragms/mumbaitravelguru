using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Package;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Packages.Commands;

public record ConfirmPackageBookingCommand(
    Guid BookingId, decimal Amount, string PaymentMethod, string? PaymentTransactionId, bool IsFinalPayment
) : IRequest<ConfirmPackageBookingResultDto>;

public class ConfirmPackageBookingCommandValidator : AbstractValidator<ConfirmPackageBookingCommand>
{
    public ConfirmPackageBookingCommandValidator()
    {
        RuleFor(v => v.BookingId).NotEmpty();
        RuleFor(v => v.Amount).GreaterThan(0);
        RuleFor(v => v.PaymentMethod).NotEmpty();
    }
}

public class ConfirmPackageBookingCommandHandler : IRequestHandler<ConfirmPackageBookingCommand, ConfirmPackageBookingResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTime _dateTime;

    public ConfirmPackageBookingCommandHandler(
        IApplicationDbContext context, ICurrentUserService currentUser, IDateTime dateTime)
    {
        _context = context; _currentUser = currentUser; _dateTime = dateTime;
    }

    public async Task<ConfirmPackageBookingResultDto> Handle(ConfirmPackageBookingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException("User not authenticated.");

        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException("Booking not found.");

        var detail = await _context.Set<PackageBookingDetail>()
            .Include(d => d.Package)
            .FirstOrDefaultAsync(d => d.BookingId == request.BookingId, cancellationToken)
            ?? throw new InvalidOperationException("Package booking detail not found.");

        if (!Enum.TryParse<PaymentMethod>(request.PaymentMethod, true, out var paymentMethod))
            paymentMethod = PaymentMethod.Wallet;

        var payment = new Payment
        {
            BookingId = booking.Id, UserId = userId,
            Method = paymentMethod, Status = PaymentStatus.Completed,
            Amount = request.Amount, Currency = detail.Currency,
            TransactionId = request.PaymentTransactionId ?? $"PKG-{Guid.NewGuid():N}"[..16],
            GatewayTransactionId = $"GATEWAY-{Guid.NewGuid():N}"[..20],
            ProcessedAt = _dateTime.UtcNow,
        };

        detail.AmountPaid += request.Amount;
        booking.PaidAmount = detail.AmountPaid;
        _context.Payments.Add(payment);

        if (request.IsFinalPayment || detail.AmountPaid >= detail.TotalPrice)
        {
            booking.Status = BookingStatus.Confirmed;
            detail.ActionStatus = "Confirmed";
            detail.BookingReference = $"PKG-{_rng.Next(1000000, 9999999)}";
            booking.ConfirmationNumber = detail.BookingReference;
            booking.CompletedAt = _dateTime.UtcNow;
        }
        else
        {
            detail.ActionStatus = "PartialPayment";
        }

        _context.AuditLogs.Add(new AuditLog
        {
            Action = request.IsFinalPayment ? "PackageBookingConfirmed" : "PackagePaymentReceived",
            UserId = userId,
            Details = $"Package booking {booking.Id} payment {request.Amount} ({detail.AmountPaid}/{detail.TotalPrice})",
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new ConfirmPackageBookingResultDto
        {
            Succeeded = true,
            ConfirmationNumber = booking.ConfirmationNumber,
            BookingReference = detail.BookingReference,
            VoucherUrl = detail.VoucherUrl,
            AmountPaid = detail.AmountPaid,
            TotalPrice = detail.TotalPrice,
            IsFullyPaid = detail.AmountPaid >= detail.TotalPrice,
        };
    }

    private static readonly Random _rng = new();
}
