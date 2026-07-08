namespace MumbaiTravelGuru.Domain.Models;

public class FareLock
{
    public string LockId { get; set; } = Guid.NewGuid().ToString("N");
    public string OfferId { get; set; } = string.Empty;
    public string SupplierId { get; set; } = string.Empty;
    public decimal LockedPrice { get; set; }
    public string Currency { get; set; } = "INR";
    public FlightSearchCriteria SearchCriteria { get; set; } = new();
    public DateTime LockedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public bool IsUsed { get; set; }
    public bool IsExpired => DateTime.UtcNow > ExpiresAtUtc || IsUsed;
}
