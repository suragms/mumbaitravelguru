namespace MumbaiTravelGuru.Domain.Models;

public class HotelSearchCriteria
{
    public string City { get; set; } = string.Empty;
    public string? Country { get; set; }
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public int Rooms { get; set; } = 1;
    public int Adults { get; set; } = 1;
    public int Children { get; set; }
    public int? MinStarRating { get; set; }
    public int? MaxStarRating { get; set; }
    public decimal? MaxPricePerNight { get; set; }
    public string? Currency { get; set; }
}
