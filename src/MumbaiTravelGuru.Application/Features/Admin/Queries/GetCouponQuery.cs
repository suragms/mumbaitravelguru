using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Coupon;

namespace MumbaiTravelGuru.Application.Features.Admin.Queries;

public record GetCouponQuery(Guid CouponId) : IRequest<CouponDto?>;

public class GetCouponQueryHandler : IRequestHandler<GetCouponQuery, CouponDto?>
{
    private readonly IApplicationDbContext _context;

    public GetCouponQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<CouponDto?> Handle(GetCouponQuery request, CancellationToken cancellationToken)
    {
        var c = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Id == request.CouponId && !c.IsDeleted, cancellationToken);
        if (c is null) return null;

        return new CouponDto(
            c.Id, c.Code, c.Type.ToString(), c.Value, c.MaxDiscountAmount,
            c.MinBookingValue, c.ApplicableVerticals,
            c.ValidFrom, c.ValidTo,
            c.MaxUsageCount, c.MaxUsagePerUser, c.CurrentUsageCount,
            c.IsActive, c.Description, c.CreatedAt, c.UpdatedAt);
    }
}
