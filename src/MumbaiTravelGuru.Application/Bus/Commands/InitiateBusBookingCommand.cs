using MediatR;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Bus.Commands;

public record InitiateBusBookingCommand(
    Guid UserId, string TripId, List<string> SeatIds,
    string BoardingPointId, string DroppingPointId) : IRequest<InitiateBusBookingResult>;

public record InitiateBusBookingResult(Guid BookingId, string FareLockId, decimal TotalAmount, string Currency);

public class InitiateBusBookingCommandHandler : IRequestHandler<InitiateBusBookingCommand, InitiateBusBookingResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IBusSupplierAdapter _busSupplier;

    public InitiateBusBookingCommandHandler(IApplicationDbContext context, IBusSupplierAdapter busSupplier)
    {
        _context = context;
        _busSupplier = busSupplier;
    }

    public async Task<InitiateBusBookingResult> Handle(InitiateBusBookingCommand request, CancellationToken cancellationToken)
    {
        var trip = await _busSupplier.GetTripDetailAsync(request.TripId, cancellationToken)
            ?? throw new InvalidOperationException("Trip not found.");

        var fareLock = await _busSupplier.LockSeatsAsync(request.TripId, request.SeatIds, cancellationToken)
            ?? throw new InvalidOperationException("Could not lock seats.");

        var boardingPoint = trip.BoardingPoints.FirstOrDefault(b => b.PointId == request.BoardingPointId)
            ?? trip.BoardingPoints.First();
        var droppingPoint = trip.DroppingPoints.FirstOrDefault(d => d.PointId == request.DroppingPointId)
            ?? trip.DroppingPoints.First();

        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            BookingType = BookingType.Bus,
            Status = BookingStatus.Pending,
            TotalAmount = fareLock.LockedPrice,
            Currency = fareLock.Currency,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        var busDetail = new BusBookingDetail
        {
            BookingId = booking.Id,
            FareLockId = fareLock.OfferId,
            TripId = request.TripId,
            OperatorName = trip.OperatorName,
            BusType = trip.BusType,
            Origin = trip.Origin,
            Destination = trip.Destination,
            DepartureTime = trip.DepartureTime,
            ArrivalTime = trip.ArrivalTime,
            BoardingPointId = request.BoardingPointId,
            BoardingPointName = boardingPoint.Name,
            DroppingPointId = request.DroppingPointId,
            DroppingPointName = droppingPoint.Name,
            SeatCount = request.SeatIds.Count,
            PricePerSeat = fareLock.LockedPrice / request.SeatIds.Count,
            TotalPrice = fareLock.LockedPrice,
            Currency = fareLock.Currency,
            ActionStatus = "Pending",
        };

        foreach (var seatId in request.SeatIds)
        {
            busDetail.BookedSeats.Add(new BusBookedSeat
            {
                SeatLabel = seatId,
            });
        }

        _context.Bookings.Add(booking);
        _context.BusBookingDetails.Add(busDetail);
        await _context.SaveChangesAsync(cancellationToken);

        return new InitiateBusBookingResult(booking.Id, fareLock.OfferId, fareLock.LockedPrice, fareLock.Currency);
    }
}
