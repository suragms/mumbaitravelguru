namespace MumbaiTravelGuru.Application.DTOs.Flight;

public class InitiateBookingRequestDto
{
    public string OfferId { get; set; } = string.Empty;
    public List<TravelerDetailDto> Travelers { get; set; } = new();
}

public class TravelerDetailDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? PassportNumber { get; set; }
    public string? Nationality { get; set; }
}

public class InitiateBookingResultDto
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public string? LockId { get; set; }
    public decimal LockedPrice { get; set; }
    public string Currency { get; set; } = "INR";
    public DateTime ExpiresAtUtc { get; set; }
    public string? BookingId { get; set; }
}
