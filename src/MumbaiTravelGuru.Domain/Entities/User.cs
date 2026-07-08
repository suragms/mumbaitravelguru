using MumbaiTravelGuru.Domain.Common;

namespace MumbaiTravelGuru.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    public string? GoogleId { get; set; }
    public string? GoogleEmail { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public Wallet? Wallet { get; set; }
    public ICollection<SavedTraveler> SavedTravelers { get; set; } = new List<SavedTraveler>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
