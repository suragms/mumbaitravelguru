using MumbaiTravelGuru.Domain.Common;
using MumbaiTravelGuru.Domain.Enums;
using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Domain.Entities;

public class FlightBookingDetail : BaseEntity
{
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;

    public string FareLockId { get; set; } = string.Empty;
    public string OfferId { get; set; } = string.Empty;
    public TripType TripType { get; set; }
    public CabinClass CabinClass { get; set; }

    public string OriginAirport { get; set; } = string.Empty;
    public string DestinationAirport { get; set; } = string.Empty;

    public DateTime? DepartureDate { get; set; }
    public DateTime? ReturnDate { get; set; }

    public int Adults { get; set; }
    public int Children { get; set; }
    public int Infants { get; set; }

    public string? PnrNumber { get; set; }
    public string? TicketStatus { get; set; }
    public string? ETicketUrl { get; set; }

    public BookingActionStatus ActionStatus { get; set; } = BookingActionStatus.Pending;

    public string? SupplierLocator { get; set; }
    public string? SupplierRawResponse { get; set; }

    public ICollection<FlightBookingPassenger> Passengers { get; set; } = new List<FlightBookingPassenger>();
    public ICollection<FlightBookingSegment> Segments { get; set; } = new List<FlightBookingSegment>();
}

public class FlightBookingPassenger : BaseEntity
{
    public Guid FlightBookingDetailId { get; set; }
    public FlightBookingDetail FlightBookingDetail { get; set; } = null!;

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? PassportNumber { get; set; }
    public string? Nationality { get; set; }
    public string? TicketNumber { get; set; }
    public string? SeatNumber { get; set; }
}

public class FlightBookingSegment : BaseEntity
{
    public Guid FlightBookingDetailId { get; set; }
    public FlightBookingDetail FlightBookingDetail { get; set; } = null!;

    public string DepartureAirportCode { get; set; } = string.Empty;
    public string ArrivalAirportCode { get; set; } = string.Empty;
    public DateTime DepartureTime { get; set; }
    public DateTime ArrivalTime { get; set; }
    public string Airline { get; set; } = string.Empty;
    public string FlightNumber { get; set; } = string.Empty;
    public string Cabin { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
}
