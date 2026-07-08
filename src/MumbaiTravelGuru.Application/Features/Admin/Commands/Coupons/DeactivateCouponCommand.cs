using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Behaviours;
using MumbaiTravelGuru.Application.Common.Interfaces;

namespace MumbaiTravelGuru.Application.Features.Admin.Commands.Coupons;

[AdminAction("AdminDeactivateCoupon", "Admin deactivated a coupon", EntityType = "Coupon", EntityIdProperty = "CouponId", LogRequest = true)]
public record DeactivateCouponCommand(Guid CouponId) : IRequest<DeactivateCouponResult>;

public class DeactivateCouponResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
}

public class DeactivateCouponCommandValidator : AbstractValidator<DeactivateCouponCommand>
{
    public DeactivateCouponCommandValidator() => RuleFor(v => v.CouponId).NotEmpty();
}

public class DeactivateCouponCommandHandler : IRequestHandler<DeactivateCouponCommand, DeactivateCouponResult>
{
    private readonly IApplicationDbContext _context;

    public DeactivateCouponCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<DeactivateCouponResult> Handle(DeactivateCouponCommand request, CancellationToken cancellationToken)
    {
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Id == request.CouponId && !c.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Coupon not found.");

        coupon.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);
        return new DeactivateCouponResult { Succeeded = true };
    }
}
