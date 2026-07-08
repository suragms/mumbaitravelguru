using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Coupon;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Coupons.Queries;

public record ValidateCouponQuery(string Code, Guid BookingId) : IRequest<ValidateCouponResultDto>;

public class ValidateCouponQueryHandler : IRequestHandler<ValidateCouponQuery, ValidateCouponResultDto>
{
    private readonly IApplicationDbContext _context;

    public ValidateCouponQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<ValidateCouponResultDto> Handle(ValidateCouponQuery request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && !b.IsDeleted, cancellationToken);
        if (booking is null)
            return new ValidateCouponResultDto(false, "Booking not found.", null, null, null, null, null, null, null);

        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Code == request.Code && !c.IsDeleted, cancellationToken);
        if (coupon is null)
            return new ValidateCouponResultDto(false, "Invalid coupon code.", null, null, null, null, null, null, null);

        if (!coupon.IsActive)
            return new ValidateCouponResultDto(false, "This coupon is no longer active.", coupon.Code, coupon.Type.ToString(), coupon.Value, coupon.MaxDiscountAmount, null, null, booking.Currency);

        var now = DateTime.UtcNow;
        if (now < coupon.ValidFrom || now > coupon.ValidTo)
            return new ValidateCouponResultDto(false, "This coupon has expired or is not yet valid.", coupon.Code, coupon.Type.ToString(), coupon.Value, coupon.MaxDiscountAmount, null, null, booking.Currency);

        if (coupon.MaxUsageCount.HasValue && coupon.CurrentUsageCount >= coupon.MaxUsageCount.Value)
            return new ValidateCouponResultDto(false, "This coupon has reached its usage limit.", coupon.Code, coupon.Type.ToString(), coupon.Value, coupon.MaxDiscountAmount, null, null, booking.Currency);

        var remainingAmount = booking.TotalAmount - booking.PaidAmount;
        if (remainingAmount < coupon.MinBookingValue)
            return new ValidateCouponResultDto(false, $"Minimum booking value of {coupon.MinBookingValue:C} required.", coupon.Code, coupon.Type.ToString(), coupon.Value, coupon.MaxDiscountAmount, null, null, booking.Currency);

        if (!string.IsNullOrEmpty(coupon.ApplicableVerticals))
        {
            var verticals = coupon.ApplicableVerticals.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (verticals.Length > 0 && !verticals.Contains(booking.BookingType.ToString(), StringComparer.OrdinalIgnoreCase))
                return new ValidateCouponResultDto(false, $"This coupon is not applicable for {booking.BookingType} bookings.", coupon.Code, coupon.Type.ToString(), coupon.Value, coupon.MaxDiscountAmount, null, null, booking.Currency);
        }

        if (coupon.MaxUsagePerUser.HasValue)
        {
            var userUsageCount = await _context.CouponUsages
                .CountAsync(u => u.CouponId == coupon.Id && u.UserId == booking.UserId, cancellationToken);
            if (userUsageCount >= coupon.MaxUsagePerUser.Value)
                return new ValidateCouponResultDto(false, "You have already used this coupon the maximum number of times.", coupon.Code, coupon.Type.ToString(), coupon.Value, coupon.MaxDiscountAmount, null, null, booking.Currency);
        }

        var discount = coupon.Type == DiscountType.Percentage
            ? remainingAmount * coupon.Value / 100
            : coupon.Value;

        if (coupon.MaxDiscountAmount.HasValue && discount > coupon.MaxDiscountAmount.Value)
            discount = coupon.MaxDiscountAmount.Value;

        if (discount > remainingAmount)
            discount = remainingAmount;

        return new ValidateCouponResultDto(true, null, coupon.Code, coupon.Type.ToString(), coupon.Value, coupon.MaxDiscountAmount, discount, remainingAmount - discount, booking.Currency);
    }
}
