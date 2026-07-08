using MediatR;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Bus;
using MumbaiTravelGuru.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MumbaiTravelGuru.Application.Bus.Commands;

public record ConfirmBusBookingCommand(
    Guid BookingId, string FareLockId, List<BusTravelerDto> Travelers) : IRequest<ConfirmBusBookingResult>;

public record ConfirmBusBookingResult(Guid BookingId, string BookingReference, string? TicketUrl);

public class ConfirmBusBookingCommandHandler : IRequestHandler<ConfirmBusBookingCommand, ConfirmBusBookingResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IBusSupplierAdapter _busSupplier;
    private readonly ICurrentUserService _currentUser;

    public ConfirmBusBookingCommandHandler(
        IApplicationDbContext context, IBusSupplierAdapter busSupplier, ICurrentUserService currentUser)
    {
        _context = context;
        _busSupplier = busSupplier;
        _currentUser = currentUser;
    }

    public async Task<ConfirmBusBookingResult> Handle(ConfirmBusBookingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException("User not authenticated.");

        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.BookingType == BookingType.Bus, cancellationToken)
            ?? throw new InvalidOperationException("Booking not found.");

        if (booking.UserId != userId)
            throw new InvalidOperationException("Booking not found.");

        var busDetail = await _context.BusBookingDetails
            .Include(d => d.BookedSeats)
            .FirstOrDefaultAsync(d => d.BookingId == request.BookingId, cancellationToken)
            ?? throw new InvalidOperationException("Bus booking detail not found.");

        var seatIds = busDetail.BookedSeats.Select(s => s.SeatLabel).ToList();

        var fareLock = new Domain.Models.FareLock
        {
            OfferId = request.FareLockId,
            SupplierId = "MOCK-BUS",
            LockedPrice = busDetail.TotalPrice,
            Currency = busDetail.Currency,
            LockedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10),
        };

        var confirmResult = await _busSupplier.ConfirmBookingAsync(fareLock, seatIds, cancellationToken);

        if (!confirmResult.Succeeded)
            throw new InvalidOperationException(confirmResult.Error ?? "Supplier confirmation failed.");

        booking.Status = BookingStatus.Confirmed;
        booking.ConfirmationNumber = confirmResult.PnrNumber;
        booking.UpdatedAt = DateTime.UtcNow;

        busDetail.BookingReference = confirmResult.PnrNumber;
        busDetail.TicketUrl = confirmResult.ETicketUrl;
        busDetail.ActionStatus = "Confirmed";

        for (int i = 0; i < busDetail.BookedSeats.Count && i < request.Travelers.Count; i++)
        {
            var seat = busDetail.BookedSeats.ElementAt(i);
            var traveler = request.Travelers[i];
            seat.PassengerName = traveler.Name;
            seat.Age = traveler.Age;
            seat.Gender = traveler.Gender;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return new ConfirmBusBookingResult(booking.Id, confirmResult.PnrNumber ?? string.Empty, confirmResult.ETicketUrl);
    }
}
