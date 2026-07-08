using MumbaiTravelGuru.Domain.Common;

namespace MumbaiTravelGuru.Domain.Entities;

public class SavedTraveler : BaseEntity
{
    public Guid UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? PassportNumber { get; set; }
    public string? FrequentFlyerNumber { get; set; }
    public string? Nationality { get; set; }
    public bool IsPrimary { get; set; }

    public User User { get; set; } = null!;
}
