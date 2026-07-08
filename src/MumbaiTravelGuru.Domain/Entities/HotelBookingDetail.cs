using MumbaiTravelGuru.Domain.Common;

namespace MumbaiTravelGuru.Domain.Entities;

public class HotelBookingDetail : BaseEntity
{
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;

    public string FareLockId { get; set; } = string.Empty;
    public string OfferId { get; set; } = string.Empty;
    public string HotelId { get; set; } = string.Empty;
    public string HotelName { get; set; } = string.Empty;
    public string HotelAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public int StarRating { get; set; }

    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public int NumberOfNights { get; set; }
    public int Rooms { get; set; }
    public int Adults { get; set; }
    public int Children { get; set; }

    public string? BoardType { get; set; }
    public string? BookingReference { get; set; }
    public string? VoucherUrl { get; set; }
    public string? CancellationPolicy { get; set; }

    public string ActionStatus { get; set; } = "Pending";

    public ICollection<HotelBookedRoom> BookedRooms { get; set; } = new List<HotelBookedRoom>();
}

public class HotelBookedRoom : BaseEntity
{
    public Guid HotelBookingDetailId { get; set; }
    public HotelBookingDetail HotelBookingDetail { get; set; } = null!;

    public string RoomType { get; set; } = string.Empty;
    public string BoardType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal PricePerNight { get; set; }
    public decimal TotalPrice { get; set; }
}
