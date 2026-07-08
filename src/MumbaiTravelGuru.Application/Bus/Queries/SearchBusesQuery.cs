using MediatR;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Bus;
using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Application.Bus.Queries;

public record SearchBusesQuery(string Origin, string Destination, DateTime TravelDate) : IRequest<List<BusTripResponseDto>>;

public class SearchBusesQueryHandler : IRequestHandler<SearchBusesQuery, List<BusTripResponseDto>>
{
    private readonly IBusSupplierAdapter _busSupplier;

    public SearchBusesQueryHandler(IBusSupplierAdapter busSupplier) => _busSupplier = busSupplier;

    public async Task<List<BusTripResponseDto>> Handle(SearchBusesQuery request, CancellationToken cancellationToken)
    {
        var criteria = new BusSearchCriteria
        {
            Origin = request.Origin,
            Destination = request.Destination,
            TravelDate = request.TravelDate,
        };
        var trips = await _busSupplier.SearchBusesAsync(criteria, cancellationToken);
        return trips.Select(MapToDto).ToList();
    }

    private static BusTripResponseDto MapToDto(BusTrip t) => new BusTripResponseDto(
        t.TripId, t.OperatorName, t.BusType, t.Origin, t.Destination,
        t.DepartureTime, t.ArrivalTime, t.DurationMinutes,
        t.PricePerSeat, t.DiscountedPricePerSeat, t.Currency,
        t.AvailableSeats, t.TotalSeats, t.Rating, t.ReviewCount,
        t.Amenities, t.CancellationPolicy,
        t.BoardingPoints.Select(b => new BusBoardingPointDto(b.PointId, b.Name, b.Address, b.Landmark, b.Time)).ToList(),
        t.DroppingPoints.Select(d => new BusDroppingPointDto(d.PointId, d.Name, d.Address, d.Landmark, d.Time)).ToList());
}
