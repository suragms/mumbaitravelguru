using MumbaiTravelGuru.Domain.Common;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Domain.Entities;

public class Coupon : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public DiscountType Type { get; set; }
    public decimal Value { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal MinBookingValue { get; set; }
    public string ApplicableVerticals { get; set; } = string.Empty;
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public int? MaxUsageCount { get; set; }
    public int? MaxUsagePerUser { get; set; }
    public int CurrentUsageCount { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }
}

public class CouponUsage : BaseEntity
{
    public Guid CouponId { get; set; }
    public Coupon Coupon { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public decimal DiscountedAmount { get; set; }
    public string Currency { get; set; } = "INR";
    public DateTime UsedAt { get; set; } = DateTime.UtcNow;
}
