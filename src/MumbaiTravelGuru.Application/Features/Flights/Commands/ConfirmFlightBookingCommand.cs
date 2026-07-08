using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Flight;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Flights.Commands;

public record ConfirmFlightBookingCommand(
    string LockId,
    string PaymentMethod,
    string? PaymentTransactionId
) : IRequest<ConfirmBookingResultDto>;

public class ConfirmFlightBookingCommandValidator : AbstractValidator<ConfirmFlightBookingCommand>
{
    public ConfirmFlightBookingCommandValidator()
    {
        RuleFor(v => v.LockId).NotEmpty();
        RuleFor(v => v.PaymentMethod).NotEmpty();
    }
}

public class ConfirmFlightBookingCommandHandler : IRequestHandler<ConfirmFlightBookingCommand, ConfirmBookingResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IFlightSupplierAdapter _supplier;
    private readonly IFareLockStore _fareLockStore;
    private readonly IDateTime _dateTime;

    public ConfirmFlightBookingCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IFlightSupplierAdapter supplier,
        IFareLockStore fareLockStore,
        IDateTime dateTime)
    {
        _context = context;
        _currentUser = currentUser;
        _supplier = supplier;
        _fareLockStore = fareLockStore;
        _dateTime = dateTime;
    }

    public async Task<ConfirmBookingResultDto> Handle(ConfirmFlightBookingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("User not authenticated.");

        var fareLock = _fareLockStore.Get(request.LockId);

        if (fareLock == null)
            return new ConfirmBookingResultDto { Succeeded = false, Error = "Fare lock expired or invalid. Please start booking again." };

        _fareLockStore.MarkUsed(request.LockId);

        var flightDetail = await _context.Set<FlightBookingDetail>()
            .Include(fd => fd.Passengers)
            .FirstOrDefaultAsync(fd => fd.FareLockId == request.LockId, cancellationToken);

        if (flightDetail == null)
            return new ConfirmBookingResultDto { Succeeded = false, Error = "Booking not found." };

        // Re-validate: the LockedPrice in fareLock is the authoritative server-side price.
        // No client-supplied price is trusted here.
        if (flightDetail.BookingId == Guid.Empty)
            return new ConfirmBookingResultDto { Succeeded = false, Error = "Invalid booking state." };

        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == flightDetail.BookingId, cancellationToken);

        if (booking == null)
            return new ConfirmBookingResultDto { Succeeded = false, Error = "Booking not found." };

        if (booking.UserId != userId)
            return new ConfirmBookingResultDto { Succeeded = false, Error = "Booking not found." };

        var travelers = flightDetail.Passengers.Select(p => new TravelerInfo(
            p.FirstName, p.LastName, p.PhoneNumber, p.Email,
            p.DateOfBirth, p.Gender, p.PassportNumber, p.Nationality
        )).ToList();

        var confirmResult = await _supplier.ConfirmBookingAsync(fareLock, travelers, cancellationToken);

        if (!confirmResult.Succeeded)
        {
            booking.Status = BookingStatus.Failed;
            flightDetail.ActionStatus = BookingActionStatus.Failed;
            await _context.SaveChangesAsync(cancellationToken);
            return new ConfirmBookingResultDto { Succeeded = false, Error = confirmResult.Error ?? "Booking confirmation failed." };
        }

        // Process payment (mock)
        if (!Enum.TryParse<PaymentMethod>(request.PaymentMethod, true, out var paymentMethod))
            paymentMethod = PaymentMethod.Wallet;

        var payment = new Payment
        {
            BookingId = booking.Id,
            UserId = userId,
            Method = paymentMethod,
            Status = PaymentStatus.Completed,
            Amount = fareLock.LockedPrice,
            Currency = fareLock.Currency,
            TransactionId = request.PaymentTransactionId ?? $"TXN-{Guid.NewGuid():N}"[..16],
            GatewayTransactionId = $"GATEWAY-{Guid.NewGuid():N}"[..20],
            ProcessedAt = _dateTime.UtcNow,
        };

        booking.Status = BookingStatus.Confirmed;
        booking.PaidAmount = fareLock.LockedPrice;
        booking.ConfirmationNumber = confirmResult.PnrNumber;
        booking.CompletedAt = _dateTime.UtcNow;

        flightDetail.ActionStatus = BookingActionStatus.Confirmed;
        flightDetail.PnrNumber = confirmResult.PnrNumber;
        flightDetail.TicketStatus = confirmResult.TicketStatus;
        flightDetail.ETicketUrl = confirmResult.ETicketUrl;
        flightDetail.SupplierLocator = confirmResult.SupplierLocator;

        _context.Payments.Add(payment);

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "FlightBookingConfirmed",
            UserId = userId,
            Details = $"Confirmed flight booking. Booking:{booking.Id} PNR:{confirmResult.PnrNumber} Amount:{fareLock.LockedPrice}",
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new ConfirmBookingResultDto
        {
            Succeeded = true,
            BookingId = booking.Id.ToString(),
            ConfirmationNumber = booking.ConfirmationNumber,
            PnrNumber = confirmResult.PnrNumber,
            TicketStatus = confirmResult.TicketStatus,
            ETicketUrl = confirmResult.ETicketUrl,
        };
    }
}
