using MumbaiTravelGuru.Domain.Common;

namespace MumbaiTravelGuru.Domain.Entities;

public class GuestReview : BaseEntity
{
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string HotelId { get; set; } = string.Empty;
    public string? HotelName { get; set; }
}
