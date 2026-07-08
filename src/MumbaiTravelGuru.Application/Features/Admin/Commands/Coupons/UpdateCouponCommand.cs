using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Behaviours;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Admin.Commands.Coupons;

[AdminAction("AdminUpdateCoupon", "Admin updated a coupon", EntityType = "Coupon", EntityIdProperty = "CouponId", LogRequest = true)]
public record UpdateCouponCommand(
    Guid CouponId, string? Code, string? Type, decimal? Value, decimal? MaxDiscountAmount,
    decimal? MinBookingValue, string? ApplicableVerticals,
    DateTime? ValidFrom, DateTime? ValidTo,
    int? MaxUsageCount, int? MaxUsagePerUser, string? Description) : IRequest<UpdateCouponResult>;

public class UpdateCouponResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
}

public class UpdateCouponCommandHandler : IRequestHandler<UpdateCouponCommand, UpdateCouponResult>
{
    private readonly IApplicationDbContext _context;

    public UpdateCouponCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<UpdateCouponResult> Handle(UpdateCouponCommand request, CancellationToken cancellationToken)
    {
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Id == request.CouponId && !c.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Coupon not found.");

        if (request.Code != null)
        {
            var duplicate = await _context.Coupons
                .AnyAsync(c => c.Code == request.Code && c.Id != request.CouponId && !c.IsDeleted, cancellationToken);
            if (duplicate)
                return new UpdateCouponResult { Succeeded = false, Error = "Another coupon with this code already exists." };
            coupon.Code = request.Code.ToUpperInvariant();
        }
        if (request.Type != null) coupon.Type = request.Type == "Percentage" ? DiscountType.Percentage : DiscountType.Flat;
        if (request.Value.HasValue) coupon.Value = request.Value.Value;
        if (request.MaxDiscountAmount.HasValue) coupon.MaxDiscountAmount = request.MaxDiscountAmount;
        if (request.MinBookingValue.HasValue) coupon.MinBookingValue = request.MinBookingValue.Value;
        if (request.ApplicableVerticals != null) coupon.ApplicableVerticals = request.ApplicableVerticals;
        if (request.ValidFrom.HasValue) coupon.ValidFrom = request.ValidFrom.Value;
        if (request.ValidTo.HasValue) coupon.ValidTo = request.ValidTo.Value;
        if (request.MaxUsageCount.HasValue) coupon.MaxUsageCount = request.MaxUsageCount;
        if (request.MaxUsagePerUser.HasValue) coupon.MaxUsagePerUser = request.MaxUsagePerUser;
        if (request.Description != null) coupon.Description = request.Description;

        await _context.SaveChangesAsync(cancellationToken);
        return new UpdateCouponResult { Succeeded = true };
    }
}
