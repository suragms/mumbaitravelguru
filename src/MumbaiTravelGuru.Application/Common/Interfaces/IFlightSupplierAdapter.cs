using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Application.Common.Interfaces;

public interface IFlightSupplierAdapter
{
    Task<List<FlightOffer>> SearchFlightsAsync(FlightSearchCriteria criteria, CancellationToken cancellationToken = default);
    Task<FlightOffer?> GetOfferByIdAsync(string offerId, CancellationToken cancellationToken = default);
    Task<FareLock?> LockFareAsync(string offerId, FlightSearchCriteria criteria, CancellationToken cancellationToken = default);
    Task<ConfirmBookingResult> ConfirmBookingAsync(FareLock fareLock, List<TravelerInfo> travelers, CancellationToken cancellationToken = default);
}

public record TravelerInfo(
    string FirstName,
    string LastName,
    string? PhoneNumber,
    string? Email,
    DateOnly? DateOfBirth,
    string? Gender,
    string? PassportNumber,
    string? Nationality
);

public record ConfirmBookingResult(
    bool Succeeded,
    string? PnrNumber,
    string? SupplierLocator,
    string? TicketStatus,
    string? ETicketUrl,
    string? Error
);
