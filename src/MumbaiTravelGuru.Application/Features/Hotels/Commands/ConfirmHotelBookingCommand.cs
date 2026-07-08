using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Hotel;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Hotels.Commands;

public record ConfirmHotelBookingCommand(string LockId, string PaymentMethod, string? PaymentTransactionId) : IRequest<ConfirmHotelBookingResultDto>;

public class ConfirmHotelBookingCommandValidator : AbstractValidator<ConfirmHotelBookingCommand>
{
    public ConfirmHotelBookingCommandValidator()
    {
        RuleFor(v => v.LockId).NotEmpty();
        RuleFor(v => v.PaymentMethod).NotEmpty();
    }
}

public class ConfirmHotelBookingCommandHandler : IRequestHandler<ConfirmHotelBookingCommand, ConfirmHotelBookingResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IHotelSupplierAdapter _supplier;
    private readonly IFareLockStore _fareLockStore;
    private readonly IDateTime _dateTime;

    public ConfirmHotelBookingCommandHandler(
        IApplicationDbContext context, ICurrentUserService currentUser,
        IHotelSupplierAdapter supplier, IFareLockStore fareLockStore, IDateTime dateTime)
    {
        _context = context; _currentUser = currentUser; _supplier = supplier; _fareLockStore = fareLockStore; _dateTime = dateTime;
    }

    public async Task<ConfirmHotelBookingResultDto> Handle(ConfirmHotelBookingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException("User not authenticated.");

        var fareLock = _fareLockStore.Get(request.LockId);
        if (fareLock == null)
            return new ConfirmHotelBookingResultDto { Succeeded = false, Error = "Rate lock expired or invalid. Please start booking again." };

        _fareLockStore.MarkUsed(request.LockId);

        var detail = await _context.Set<HotelBookingDetail>()
            .FirstOrDefaultAsync(d => d.FareLockId == request.LockId, cancellationToken);

        if (detail == null)
            return new ConfirmHotelBookingResultDto { Succeeded = false, Error = "Booking not found." };

        var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.Id == detail.BookingId, cancellationToken);
        if (booking == null)
            return new ConfirmHotelBookingResultDto { Succeeded = false, Error = "Booking not found." };

        if (booking.UserId != userId)
            return new ConfirmHotelBookingResultDto { Succeeded = false, Error = "Booking not found." };

        // Confirm with supplier (uses server-side locked price)
        var confirmResult = await _supplier.ConfirmBookingAsync(fareLock, new List<TravelerInfo>(), cancellationToken);

        if (!confirmResult.Succeeded)
        {
            booking.Status = BookingStatus.Failed;
            detail.ActionStatus = "Failed";
            await _context.SaveChangesAsync(cancellationToken);
            return new ConfirmHotelBookingResultDto { Succeeded = false, Error = confirmResult.Error ?? "Confirmation failed." };
        }

        if (!Enum.TryParse<PaymentMethod>(request.PaymentMethod, true, out var paymentMethod))
            paymentMethod = PaymentMethod.Wallet;

        var payment = new Payment
        {
            BookingId = booking.Id, UserId = userId,
            Method = paymentMethod, Status = PaymentStatus.Completed,
            Amount = fareLock.LockedPrice, Currency = fareLock.Currency,
            TransactionId = request.PaymentTransactionId ?? $"HTL-{Guid.NewGuid():N}"[..16],
            GatewayTransactionId = $"GATEWAY-{Guid.NewGuid():N}"[..20],
            ProcessedAt = _dateTime.UtcNow,
        };

        booking.Status = BookingStatus.Confirmed;
        booking.PaidAmount = fareLock.LockedPrice;
        booking.ConfirmationNumber = confirmResult.PnrNumber;
        booking.CompletedAt = _dateTime.UtcNow;

        detail.ActionStatus = "Confirmed";
        detail.BookingReference = confirmResult.PnrNumber;
        detail.VoucherUrl = confirmResult.ETicketUrl;

        _context.Payments.Add(payment);

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "HotelBookingConfirmed",
            UserId = userId,
            Details = $"Confirmed hotel booking. Booking:{booking.Id} Ref:{confirmResult.PnrNumber}",
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new ConfirmHotelBookingResultDto
        {
            Succeeded = true,
            BookingId = booking.Id.ToString(),
            ConfirmationNumber = booking.ConfirmationNumber,
            BookingReference = confirmResult.PnrNumber,
            VoucherUrl = confirmResult.ETicketUrl,
        };
    }
}
