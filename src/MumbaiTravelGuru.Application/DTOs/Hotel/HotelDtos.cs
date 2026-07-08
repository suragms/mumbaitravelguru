using MumbaiTravelGuru.Application.DTOs.Flight;

namespace MumbaiTravelGuru.Application.DTOs.Hotel;

public class HotelOfferDto
{
    public string OfferId { get; set; } = string.Empty;
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
    public List<HotelRoomOfferDto> Rooms { get; set; } = new();
    public decimal TotalPrice { get; set; }
    public string Currency { get; set; } = "INR";
    public DateTime PriceExpiryUtc { get; set; }
}

public class HotelRoomOfferDto
{
    public string RoomId { get; set; } = string.Empty;
    public string RoomType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MaxAdults { get; set; }
    public int MaxChildren { get; set; }
    public int TotalRoomsAvailable { get; set; }
    public decimal PricePerNight { get; set; }
    public decimal TotalPrice { get; set; }
    public string Currency { get; set; } = "INR";
    public string BoardType { get; set; } = string.Empty;
    public bool IsRefundable { get; set; }
    public string? CancellationPolicy { get; set; }
    public List<string> RoomAmenities { get; set; } = new();
}

public class HotelSearchRequestDto
{
    public string City { get; set; } = string.Empty;
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public int Rooms { get; set; } = 1;
    public int Adults { get; set; } = 1;
    public int Children { get; set; }
    public int? MinStarRating { get; set; }
    public decimal? MaxPricePerNight { get; set; }
}

public class InitiateHotelBookingRequestDto
{
    public string OfferId { get; set; } = string.Empty;
    public string RoomId { get; set; } = string.Empty;
    public int RoomQuantity { get; set; } = 1;
    public List<TravelerDetailDto> Travelers { get; set; } = new();
}

public class InitiateHotelBookingResultDto
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public string? LockId { get; set; }
    public decimal LockedPrice { get; set; }
    public string Currency { get; set; } = "INR";
    public DateTime ExpiresAtUtc { get; set; }
    public string? BookingId { get; set; }
}

public class ConfirmHotelBookingRequestDto
{
    public string LockId { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string? PaymentTransactionId { get; set; }
}

public class ConfirmHotelBookingResultDto
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public string? BookingId { get; set; }
    public string? ConfirmationNumber { get; set; }
    public string? BookingReference { get; set; }
    public string? VoucherUrl { get; set; }
}

public class GuestReviewDto
{
    public string ReviewId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class SubmitReviewRequestDto
{
    public Guid BookingId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string? HotelId { get; set; }
    public string? HotelName { get; set; }
}
