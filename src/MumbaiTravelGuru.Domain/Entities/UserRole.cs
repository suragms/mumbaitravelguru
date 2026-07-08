using MumbaiTravelGuru.Domain.Common;

namespace MumbaiTravelGuru.Domain.Entities;

public class UserRole : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid RoleId { get; set; }

    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}
