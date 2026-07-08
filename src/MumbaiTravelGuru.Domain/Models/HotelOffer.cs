namespace MumbaiTravelGuru.Domain.Models;

public class HotelOffer
{
    public string OfferId { get; set; } = Guid.NewGuid().ToString("N")[..12];
    public string HotelId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int StarRating { get; set; }
    public double GuestRating { get; set; }
    public int ReviewCount { get; set; }
    public List<string> PhotoUrls { get; set; } = new();
    public List<string> Amenities { get; set; } = new();
    public List<string> Policies { get; set; } = new();
    public List<HotelRoomOffer> Rooms { get; set; } = new();
    public decimal TotalPrice { get; set; }
    public string Currency { get; set; } = "INR";
    public DateTime PriceExpiryUtc { get; set; }
    public int SeatsAvailable { get; set; }
}

public class HotelRoomOffer
{
    public string RoomId { get; set; } = Guid.NewGuid().ToString("N")[..12];
    public string RoomType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MaxAdults { get; set; }
    public int MaxChildren { get; set; }
    public int TotalRoomsAvailable { get; set; }
    public decimal PricePerNight { get; set; }
    public decimal TotalPrice { get; set; }
    public string Currency { get; set; } = "INR";
    public string BoardType { get; set; } = "Room Only";
    public bool IsRefundable { get; set; }
    public string? CancellationPolicy { get; set; }
    public List<string> RoomAmenities { get; set; } = new();
}
