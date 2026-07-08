using MumbaiTravelGuru.Domain.Common;

namespace MumbaiTravelGuru.Domain.Entities;

public class BusBookingDetail : BaseEntity
{
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;

    public string FareLockId { get; set; } = string.Empty;
    public string TripId { get; set; } = string.Empty;
    public string OperatorName { get; set; } = string.Empty;
    public string BusType { get; set; } = string.Empty;

    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime DepartureTime { get; set; }
    public DateTime ArrivalTime { get; set; }

    public string BoardingPointId { get; set; } = string.Empty;
    public string BoardingPointName { get; set; } = string.Empty;
    public string DroppingPointId { get; set; } = string.Empty;
    public string DroppingPointName { get; set; } = string.Empty;

    public int SeatCount { get; set; }
    public decimal PricePerSeat { get; set; }
    public decimal TotalPrice { get; set; }
    public string Currency { get; set; } = "INR";

    public string? BookingReference { get; set; }
    public string? TicketUrl { get; set; }
    public string ActionStatus { get; set; } = "Pending";

    public ICollection<BusBookedSeat> BookedSeats { get; set; } = new List<BusBookedSeat>();
}

public class BusBookedSeat : BaseEntity
{
    public Guid BusBookingDetailId { get; set; }
    public BusBookingDetail BusBookingDetail { get; set; } = null!;

    public string SeatLabel { get; set; } = string.Empty;
    public string Deck { get; set; } = "Lower";
    public int Row { get; set; }
    public int Col { get; set; }
    public decimal Price { get; set; }
    public string? PassengerName { get; set; }
    public int? Age { get; set; }
    public string? Gender { get; set; }
}
