namespace MumbaiTravelGuru.Application.DTOs.SavedTraveler;

public class SavedTravelerDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? PassportNumber { get; set; }
    public string? FrequentFlyerNumber { get; set; }
    public string? Nationality { get; set; }
    public bool IsPrimary { get; set; }
    public DateTime CreatedAt { get; set; }
}
