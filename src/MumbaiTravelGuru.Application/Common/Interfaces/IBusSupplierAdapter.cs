using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Application.Common.Interfaces;

public interface IBusSupplierAdapter
{
    Task<List<BusTrip>> SearchBusesAsync(BusSearchCriteria criteria, CancellationToken cancellationToken = default);
    Task<BusTrip?> GetTripDetailAsync(string tripId, CancellationToken cancellationToken = default);
    Task<BusSeatLayout?> GetSeatLayoutAsync(string tripId, CancellationToken cancellationToken = default);
    Task<FareLock?> LockSeatsAsync(string tripId, List<string> seatIds, CancellationToken cancellationToken = default);
    Task<ConfirmBookingResult> ConfirmBookingAsync(FareLock fareLock, List<string> seatIds, CancellationToken cancellationToken = default);
}
