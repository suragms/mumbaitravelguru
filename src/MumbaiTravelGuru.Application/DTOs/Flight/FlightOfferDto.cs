namespace MumbaiTravelGuru.Application.DTOs.Flight;

public class FlightOfferDto
{
    public string OfferId { get; set; } = string.Empty;
    public string TripType { get; set; } = string.Empty;
    public List<FlightSegmentDto> OutboundSegments { get; set; } = new();
    public List<FlightSegmentDto> ReturnSegments { get; set; } = new();
    public decimal TotalPrice { get; set; }
    public decimal BaseFare { get; set; }
    public decimal Taxes { get; set; }
    public decimal OtherCharges { get; set; }
    public string Currency { get; set; } = "INR";
    public int TotalStops { get; set; }
    public int TotalDurationMinutes { get; set; }
    public string Airline { get; set; } = string.Empty;
    public int SeatsAvailable { get; set; }
    public DateTime PriceExpiryUtc { get; set; }
    public List<string> FareRules { get; set; } = new();
}
