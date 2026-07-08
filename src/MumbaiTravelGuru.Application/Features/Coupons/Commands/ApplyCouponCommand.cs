using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Coupons.Commands;

public record ApplyCouponResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public decimal OriginalAmount { get; set; }
    public decimal DiscountedAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? CouponCode { get; set; }
}

public record ApplyCouponCommand(Guid BookingId, string CouponCode) : IRequest<ApplyCouponResult>;

public class ApplyCouponCommandValidator : AbstractValidator<ApplyCouponCommand>
{
    public ApplyCouponCommandValidator()
    {
        RuleFor(v => v.BookingId).NotEmpty();
        RuleFor(v => v.CouponCode).NotEmpty().MaximumLength(50);
    }
}

public class ApplyCouponCommandHandler : IRequestHandler<ApplyCouponCommand, ApplyCouponResult>
{
    private readonly IApplicationDbContext _context;

    public ApplyCouponCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<ApplyCouponResult> Handle(ApplyCouponCommand request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && !b.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Booking not found.");

        if (booking.Status != BookingStatus.Pending)
            return new ApplyCouponResult { Succeeded = false, Error = "Booking is not in a payable state." };

        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Code == request.CouponCode && !c.IsDeleted, cancellationToken);
        if (coupon is null)
            return new ApplyCouponResult { Succeeded = false, Error = "Invalid coupon code." };

        if (!coupon.IsActive)
            return new ApplyCouponResult { Succeeded = false, Error = "This coupon is no longer active." };

        var now = DateTime.UtcNow;
        if (now < coupon.ValidFrom || now > coupon.ValidTo)
            return new ApplyCouponResult { Succeeded = false, Error = "This coupon has expired or is not yet valid." };

        if (coupon.MaxUsageCount.HasValue && coupon.CurrentUsageCount >= coupon.MaxUsageCount.Value)
            return new ApplyCouponResult { Succeeded = false, Error = "This coupon has reached its usage limit." };

        var remainingAmount = booking.TotalAmount - booking.PaidAmount;
        if (remainingAmount < coupon.MinBookingValue)
            return new ApplyCouponResult { Succeeded = false, Error = $"Minimum booking value of {coupon.MinBookingValue:C} required." };

        if (!string.IsNullOrEmpty(coupon.ApplicableVerticals))
        {
            var verticals = coupon.ApplicableVerticals.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (verticals.Length > 0 && !verticals.Contains(booking.BookingType.ToString(), StringComparer.OrdinalIgnoreCase))
                return new ApplyCouponResult { Succeeded = false, Error = $"This coupon is not applicable for {booking.BookingType} bookings." };
        }

        if (coupon.MaxUsagePerUser.HasValue)
        {
            var userUsageCount = await _context.CouponUsages
                .CountAsync(u => u.CouponId == coupon.Id && u.UserId == booking.UserId, cancellationToken);
            if (userUsageCount >= coupon.MaxUsagePerUser.Value)
                return new ApplyCouponResult { Succeeded = false, Error = "You have already used this coupon the maximum number of times." };
        }

        var discount = coupon.Type == DiscountType.Percentage
            ? remainingAmount * coupon.Value / 100
            : coupon.Value;

        if (coupon.MaxDiscountAmount.HasValue && discount > coupon.MaxDiscountAmount.Value)
            discount = coupon.MaxDiscountAmount.Value;

        if (discount > remainingAmount)
            discount = remainingAmount;

        var finalAmount = remainingAmount - discount;
        if (finalAmount < 0) finalAmount = 0;

        coupon.CurrentUsageCount++;

        _context.CouponUsages.Add(new CouponUsage
        {
            CouponId = coupon.Id,
            UserId = booking.UserId,
            BookingId = booking.Id,
            DiscountedAmount = discount,
            Currency = booking.Currency,
            UsedAt = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new ApplyCouponResult
        {
            Succeeded = true,
            OriginalAmount = remainingAmount,
            DiscountedAmount = discount,
            FinalAmount = finalAmount,
            Currency = booking.Currency,
            CouponCode = coupon.Code,
        };
    }
}
