namespace MumbaiTravelGuru.Domain.Models;

public class GuestReview
{
    public string ReviewId { get; set; } = Guid.NewGuid().ToString("N")[..12];
    public string HotelId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? BookingId { get; set; }
}
