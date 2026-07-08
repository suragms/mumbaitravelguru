namespace MumbaiTravelGuru.Application.DTOs.Bus;

public record BusSearchRequestDto(string Origin, string Destination, DateTime TravelDate);

public record BusTripResponseDto(
    string TripId, string OperatorName, string BusType, string Origin, string Destination,
    DateTime DepartureTime, DateTime ArrivalTime, int DurationMinutes,
    decimal PricePerSeat, decimal? DiscountedPricePerSeat, string Currency,
    int AvailableSeats, int TotalSeats, double Rating, int ReviewCount,
    List<string> Amenities, string CancellationPolicy,
    List<BusBoardingPointDto> BoardingPoints, List<BusDroppingPointDto> DroppingPoints);

public record BusBoardingPointDto(string PointId, string Name, string Address, string Landmark, DateTime Time);
public record BusDroppingPointDto(string PointId, string Name, string Address, string Landmark, DateTime Time);

public record BusSeatLayoutResponseDto(string TripId, string DeckType, int TotalRows, string ColumnConfig, List<BusSeatDto> Seats);

public record BusSeatDto(string SeatId, int Row, int Column, string Label, string Deck, string Type,
    bool IsBooked, bool IsBlocked, decimal Price, bool IsWindow, bool IsAisle);

public record InitiateBusBookingRequestDto(string TripId, List<string> SeatIds, string BoardingPointId, string DroppingPointId);

public record ConfirmBusBookingRequestDto(Guid BookingId, string FareLockId, List<BusTravelerDto> Travelers);

public record BusTravelerDto(string? Name, int? Age, string? Gender);
