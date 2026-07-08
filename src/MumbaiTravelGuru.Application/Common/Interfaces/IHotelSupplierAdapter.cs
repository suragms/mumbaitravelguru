using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Application.Common.Interfaces;

public interface IHotelSupplierAdapter
{
    Task<List<HotelOffer>> SearchHotelsAsync(HotelSearchCriteria criteria, CancellationToken cancellationToken = default);
    Task<HotelOffer?> GetHotelDetailAsync(string hotelId, CancellationToken cancellationToken = default);
    Task<HotelOffer?> GetOfferByIdAsync(string offerId, CancellationToken cancellationToken = default);
    Task<FareLock?> LockRateAsync(string offerId, string roomId, HotelSearchCriteria criteria, CancellationToken cancellationToken = default);
    Task<ConfirmBookingResult> ConfirmBookingAsync(FareLock fareLock, List<TravelerInfo> travelers, CancellationToken cancellationToken = default);
}
