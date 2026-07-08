using MumbaiTravelGuru.Domain.Common;

namespace MumbaiTravelGuru.Domain.Entities;

public class AuditLog : BaseEntity
{
    public string Action { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Details { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
}
