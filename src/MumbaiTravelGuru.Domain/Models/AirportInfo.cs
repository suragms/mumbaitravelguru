namespace MumbaiTravelGuru.Domain.Models;

public record AirportInfo
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string Country { get; init; } = string.Empty;
    public string TimeZone { get; init; } = string.Empty;
}
