namespace MumbaiTravelGuru.Application.DTOs.Flight;

public class FlightSearchRequestDto
{
    public string Origin { get; set; } = string.Empty;
    public List<string> Destinations { get; set; } = new();
    public List<string> DepartureDates { get; set; } = new();
    public int Adults { get; set; } = 1;
    public int Children { get; set; }
    public int Infants { get; set; }
    public string CabinClass { get; set; } = "Economy";
    public string TripType { get; set; } = "OneWay";
    public string? Currency { get; set; }
}
