using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Domain.Models;

public class FlightSearchCriteria
{
    public string Origin { get; set; } = string.Empty;
    public List<string> Destinations { get; set; } = new();
    public List<DateTime> DepartureDates { get; set; } = new();
    public TripType TripType { get; set; }
    public int Adults { get; set; } = 1;
    public int Children { get; set; }
    public int Infants { get; set; }
    public CabinClass CabinClass { get; set; } = CabinClass.Economy;
    public string? Currency { get; set; }
}
