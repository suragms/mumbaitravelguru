namespace MumbaiTravelGuru.Application.DTOs.Flight;

public class FlightSegmentDto
{
    public string DepartureAirportCode { get; set; } = string.Empty;
    public string ArrivalAirportCode { get; set; } = string.Empty;
    public DateTime DepartureTime { get; set; }
    public DateTime ArrivalTime { get; set; }
    public string Airline { get; set; } = string.Empty;
    public string FlightNumber { get; set; } = string.Empty;
    public string Cabin { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
}
