namespace MumbaiTravelGuru.Application.DTOs.Coupon;

public record CouponDto(
    Guid Id, string Code, string Type, decimal Value, decimal? MaxDiscountAmount,
    decimal MinBookingValue, string ApplicableVerticals,
    DateTime ValidFrom, DateTime ValidTo,
    int? MaxUsageCount, int? MaxUsagePerUser, int CurrentUsageCount,
    bool IsActive, string? Description,
    DateTime CreatedAt, DateTime? UpdatedAt);

public record CreateCouponRequestDto(
    string Code, string Type, decimal Value, decimal? MaxDiscountAmount,
    decimal MinBookingValue, string ApplicableVerticals,
    DateTime ValidFrom, DateTime ValidTo,
    int? MaxUsageCount, int? MaxUsagePerUser, string? Description);

public record UpdateCouponRequestDto(
    string? Code, string? Type, decimal? Value, decimal? MaxDiscountAmount,
    decimal? MinBookingValue, string? ApplicableVerticals,
    DateTime? ValidFrom, DateTime? ValidTo,
    int? MaxUsageCount, int? MaxUsagePerUser, string? Description);

public record ValidateCouponRequestDto(string Code, Guid BookingId);

public record ValidateCouponResultDto(
    bool IsValid, string? Error,
    string? Code, string? Type, decimal? Value, decimal? MaxDiscountAmount,
    decimal? DiscountedAmount, decimal? FinalAmount, string? Currency);

public record ApplyCouponRequestDto(Guid BookingId, string CouponCode);
