using MediatR;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Bus;

namespace MumbaiTravelGuru.Application.Bus.Queries;

public record GetBusSeatsQuery(string TripId) : IRequest<BusSeatLayoutResponseDto?>;

public class GetBusSeatsQueryHandler : IRequestHandler<GetBusSeatsQuery, BusSeatLayoutResponseDto?>
{
    private readonly IBusSupplierAdapter _busSupplier;

    public GetBusSeatsQueryHandler(IBusSupplierAdapter busSupplier) => _busSupplier = busSupplier;

    public async Task<BusSeatLayoutResponseDto?> Handle(GetBusSeatsQuery request, CancellationToken cancellationToken)
    {
        var layout = await _busSupplier.GetSeatLayoutAsync(request.TripId, cancellationToken);
        if (layout is null) return null;

        return new BusSeatLayoutResponseDto(
            layout.TripId, layout.DeckType, layout.TotalRows, layout.ColumnConfig,
            layout.Seats.Select(s => new BusSeatDto(s.SeatId, s.Row, s.Column, s.Label, s.Deck, s.Type,
                s.IsBooked, s.IsBlocked, s.Price, s.IsWindow, s.IsAisle)).ToList());
    }
}
