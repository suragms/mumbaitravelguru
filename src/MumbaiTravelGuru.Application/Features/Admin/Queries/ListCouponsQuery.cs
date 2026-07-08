using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Coupon;

namespace MumbaiTravelGuru.Application.Features.Admin.Queries;

public record ListCouponsQuery(string? Search, bool? IsActive, int Page = 1, int PageSize = 20) : IRequest<CouponListResult>;

public record CouponListResult(List<CouponDto> Items, int TotalCount, int Page, int PageSize);

public class ListCouponsQueryHandler : IRequestHandler<ListCouponsQuery, CouponListResult>
{
    private readonly IApplicationDbContext _context;

    public ListCouponsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<CouponListResult> Handle(ListCouponsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Coupons.Where(c => !c.IsDeleted).AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(c => c.Code.Contains(request.Search));

        if (request.IsActive.HasValue)
            query = query.Where(c => c.IsActive == request.IsActive.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CouponDto(
                c.Id, c.Code, c.Type.ToString(), c.Value, c.MaxDiscountAmount,
                c.MinBookingValue, c.ApplicableVerticals,
                c.ValidFrom, c.ValidTo,
                c.MaxUsageCount, c.MaxUsagePerUser, c.CurrentUsageCount,
                c.IsActive, c.Description, c.CreatedAt, c.UpdatedAt))
            .ToListAsync(cancellationToken);

        return new CouponListResult(items, totalCount, request.Page, request.PageSize);
    }
}
