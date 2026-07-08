using MumbaiTravelGuru.Domain.Common;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Domain.Entities;

public class Booking : BaseEntity
{
    public Guid UserId { get; set; }
    public BookingType BookingType { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public string? ConfirmationNumber { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? SpecialRequests { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool NeedsReconciliation { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
