using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Domain.Models;

public class FlightOffer
{
    public string OfferId { get; set; } = Guid.NewGuid().ToString("N")[..12];
    public TripType TripType { get; set; }
    public List<FlightSegment> OutboundSegments { get; set; } = new();
    public List<FlightSegment> ReturnSegments { get; set; } = new();
    public decimal TotalPrice { get; set; }
    public decimal BaseFare { get; set; }
    public decimal Taxes { get; set; }
    public decimal OtherCharges { get; set; }
    public string Currency { get; set; } = "INR";
    public int TotalStops => OutboundSegments.Count - 1 + (ReturnSegments.Count > 0 ? ReturnSegments.Count - 1 : 0);
    public int TotalDurationMinutes => OutboundSegments.Sum(s => s.DurationMinutes) + ReturnSegments.Sum(s => s.DurationMinutes);
    public string Airline => OutboundSegments.FirstOrDefault()?.Airline ?? string.Empty;
    public int SeatsAvailable { get; set; }
    public DateTime PriceExpiryUtc { get; set; }
    public string FareClass { get; set; } = string.Empty;
    public List<string> FareRules { get; set; } = new();
}
