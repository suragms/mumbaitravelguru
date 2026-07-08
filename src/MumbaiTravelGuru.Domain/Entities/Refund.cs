using MumbaiTravelGuru.Domain.Common;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Domain.Entities;

public class Refund : BaseEntity
{
    public Guid PaymentId { get; set; }
    public Guid BookingId { get; set; }
    public Guid UserId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public RefundStatus Status { get; set; } = RefundStatus.Pending;
    public string? Reason { get; set; }
    public string? GatewayRefundId { get; set; }
    public DateTime? ProcessedAt { get; set; }

    public Payment Payment { get; set; } = null!;
    public Booking Booking { get; set; } = null!;
    public User User { get; set; } = null!;
}
