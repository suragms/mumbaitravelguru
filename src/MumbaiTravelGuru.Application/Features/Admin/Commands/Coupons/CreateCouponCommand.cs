using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Behaviours;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Admin.Commands.Coupons;

[AdminAction("AdminCreateCoupon", "Admin created a coupon", EntityType = "Coupon", LogRequest = true)]
public record CreateCouponCommand(
    string Code, string Type, decimal Value, decimal? MaxDiscountAmount,
    decimal MinBookingValue, string ApplicableVerticals,
    DateTime ValidFrom, DateTime ValidTo,
    int? MaxUsageCount, int? MaxUsagePerUser, string? Description) : IRequest<CreateCouponResult>;

public class CreateCouponResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public Guid? CouponId { get; set; }
}

public class CreateCouponCommandValidator : AbstractValidator<CreateCouponCommand>
{
    public CreateCouponCommandValidator()
    {
        RuleFor(v => v.Code).NotEmpty().MaximumLength(50);
        RuleFor(v => v.Type).NotEmpty().Must(t => t is "Percentage" or "Flat");
        RuleFor(v => v.Value).GreaterThan(0);
        RuleFor(v => v.MinBookingValue).GreaterThanOrEqualTo(0);
        RuleFor(v => v.ApplicableVerticals).NotEmpty();
        RuleFor(v => v.ValidTo).GreaterThan(v => v.ValidFrom);
        RuleFor(v => v.MaxUsageCount).GreaterThan(0).When(v => v.MaxUsageCount.HasValue);
        RuleFor(v => v.MaxUsagePerUser).GreaterThan(0).When(v => v.MaxUsagePerUser.HasValue);
    }
}

public class CreateCouponCommandHandler : IRequestHandler<CreateCouponCommand, CreateCouponResult>
{
    private readonly IApplicationDbContext _context;

    public CreateCouponCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<CreateCouponResult> Handle(CreateCouponCommand request, CancellationToken cancellationToken)
    {
        var existing = await _context.Coupons
            .AnyAsync(c => c.Code == request.Code && !c.IsDeleted, cancellationToken);
        if (existing)
            return new CreateCouponResult { Succeeded = false, Error = "A coupon with this code already exists." };

        var coupon = new Coupon
        {
            Code = request.Code.ToUpperInvariant(),
            Type = request.Type == "Percentage" ? DiscountType.Percentage : DiscountType.Flat,
            Value = request.Value,
            MaxDiscountAmount = request.MaxDiscountAmount,
            MinBookingValue = request.MinBookingValue,
            ApplicableVerticals = request.ApplicableVerticals,
            ValidFrom = request.ValidFrom,
            ValidTo = request.ValidTo,
            MaxUsageCount = request.MaxUsageCount,
            MaxUsagePerUser = request.MaxUsagePerUser,
            Description = request.Description,
            IsActive = true,
            CurrentUsageCount = 0,
        };

        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateCouponResult { Succeeded = true, CouponId = coupon.Id };
    }
}
