using MumbaiTravelGuru.Domain.Common;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid BookingId { get; set; }
    public Guid UserId { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? TransactionId { get; set; }
    public string? GatewayTransactionId { get; set; }
    public string? GatewayOrderId { get; set; }
    public string? FailureReason { get; set; }
    public DateTime? ProcessedAt { get; set; }

    public Booking Booking { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
}
