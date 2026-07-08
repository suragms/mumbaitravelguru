using System;

namespace MumbaiTravelGuru.Domain.Entities
{
    public class AuditLog
    {
        public Guid Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public Guid? UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string IpAddress { get; set; } = string.Empty;
    }
}
