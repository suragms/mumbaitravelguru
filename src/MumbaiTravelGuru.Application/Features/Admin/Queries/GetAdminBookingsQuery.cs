using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Admin.Queries;

public record GetAdminBookingsQuery(
    string? Search, string? BookingType, string? Status,
    DateTime? DateFrom, DateTime? DateTo, int Page = 1, int PageSize = 20
) : IRequest<AdminBookingsResult>;

public class AdminBookingsResult
{
    public List<AdminBookingListItemDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class GetAdminBookingsQueryHandler : IRequestHandler<GetAdminBookingsQuery, AdminBookingsResult>
{
    private readonly IApplicationDbContext _context;

    public GetAdminBookingsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<AdminBookingsResult> Handle(GetAdminBookingsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Bookings
            .Include(b => b.User)
            .Where(b => !b.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(b =>
                b.Id.ToString().Contains(search) ||
                b.User.Email.ToLower().Contains(search) ||
                (b.ConfirmationNumber != null && b.ConfirmationNumber.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(request.BookingType) && Enum.TryParse<BookingType>(request.BookingType, true, out var type))
            query = query.Where(b => b.BookingType == type);

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<BookingStatus>(request.Status, true, out var status))
            query = query.Where(b => b.Status == status);

        if (request.DateFrom.HasValue)
            query = query.Where(b => b.CreatedAt >= request.DateFrom.Value);

        if (request.DateTo.HasValue)
            query = query.Where(b => b.CreatedAt <= request.DateTo.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(b => new AdminBookingListItemDto
            {
                Id = b.Id,
                UserId = b.UserId,
                UserEmail = b.User.Email,
                UserName = b.User.FirstName + " " + b.User.LastName,
                BookingType = b.BookingType.ToString(),
                Status = b.Status.ToString(),
                TotalAmount = b.TotalAmount,
                PaidAmount = b.PaidAmount,
                Currency = b.Currency,
                ConfirmationNumber = b.ConfirmationNumber,
                CreatedAt = b.CreatedAt,
                NeedsReconciliation = b.NeedsReconciliation,
            })
            .ToListAsync(cancellationToken);

        return new AdminBookingsResult { Items = items, TotalCount = totalCount, Page = request.Page, PageSize = request.PageSize };
    }
}
