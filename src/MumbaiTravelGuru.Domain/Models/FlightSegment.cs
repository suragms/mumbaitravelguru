using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Domain.Models;

public class FlightSegment
{
    public string DepartureAirportCode { get; set; } = string.Empty;
    public string ArrivalAirportCode { get; set; } = string.Empty;
    public DateTime DepartureTime { get; set; }
    public DateTime ArrivalTime { get; set; }
    public string Airline { get; set; } = string.Empty;
    public string FlightNumber { get; set; } = string.Empty;
    public string OperatingCarrier { get; set; } = string.Empty;
    public CabinClass Cabin { get; set; }
    public int DurationMinutes { get; set; }
}
