using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Admin.Queries;

public record GetAdminDashboardQuery : IRequest<AdminDashboardDto>;

public class GetAdminDashboardQueryHandler : IRequestHandler<GetAdminDashboardQuery, AdminDashboardDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTime _dateTime;

    public GetAdminDashboardQueryHandler(IApplicationDbContext context, IDateTime dateTime)
    {
        _context = context; _dateTime = dateTime;
    }

    public async Task<AdminDashboardDto> Handle(GetAdminDashboardQuery request, CancellationToken cancellationToken)
    {
        var now = _dateTime.UtcNow;
        var todayStart = now.Date;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var tomorrow = todayStart.AddDays(1);

        var bookings = _context.Bookings.Where(b => !b.IsDeleted);

        var todayBookings = await bookings.CountAsync(b => b.CreatedAt >= todayStart && b.CreatedAt < tomorrow, cancellationToken);
        var monthBookings = await bookings.CountAsync(b => b.CreatedAt >= monthStart, cancellationToken);

        var todayRevenue = await bookings
            .Where(b => b.Status == BookingStatus.Confirmed && b.CompletedAt >= todayStart && b.CompletedAt < tomorrow)
            .SumAsync(b => b.PaidAmount, cancellationToken);

        var monthRevenue = await bookings
            .Where(b => b.Status == BookingStatus.Confirmed && b.CompletedAt >= monthStart)
            .SumAsync(b => b.PaidAmount, cancellationToken);

        var pendingRecon = await bookings.CountAsync(b => b.NeedsReconciliation, cancellationToken);

        var revenueByVertical = await bookings
            .Where(b => b.Status == BookingStatus.Confirmed)
            .GroupBy(b => b.BookingType)
            .Select(g => new RevenueByVerticalDto
            {
                Vertical = g.Key.ToString(),
                Revenue = g.Sum(b => b.PaidAmount),
                BookingCount = g.Count(),
            })
            .ToListAsync(cancellationToken);

        var last7DaysStart = todayStart.AddDays(-6);
        var countsByDate = await bookings
            .Where(b => b.CreatedAt >= last7DaysStart && b.CreatedAt < tomorrow)
            .GroupBy(b => b.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Date, x => x.Count, cancellationToken);

        var revenueByDate = await bookings
            .Where(b => b.Status == BookingStatus.Confirmed && b.CompletedAt >= last7DaysStart && b.CompletedAt < tomorrow)
            .GroupBy(b => b.CompletedAt!.Value.Date)
            .Select(g => new { Date = g.Key, Revenue = g.Sum(b => b.PaidAmount) })
            .ToDictionaryAsync(x => x.Date, x => x.Revenue, cancellationToken);

        var bookingsPerDay = Enumerable.Range(0, 7).Select(i =>
        {
            var date = todayStart.AddDays(-6 + i);
            return new BookingsPerDayDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                Count = countsByDate.GetValueOrDefault(date, 0),
                Revenue = revenueByDate.GetValueOrDefault(date, 0),
            };
        }).ToList();

        var flightDetails = _context.Set<FlightBookingDetail>().Where(d => !d.IsDeleted);
        var topRoutes = await flightDetails
            .Where(d => !string.IsNullOrEmpty(d.OriginAirport) && !string.IsNullOrEmpty(d.DestinationAirport))
            .GroupBy(d => new { d.OriginAirport, d.DestinationAirport })
            .Select(g => new TopRouteDto
            {
                Origin = g.Key.OriginAirport,
                Destination = g.Key.DestinationAirport,
                Count = g.Count(),
            })
            .OrderByDescending(r => r.Count)
            .Take(5)
            .ToListAsync(cancellationToken);

        var totalInitiations = await _context.AuditLogs
            .CountAsync(a => a.Action.Contains("BookingInitiated") && a.CreatedAt >= monthStart, cancellationToken);

        var totalConfirmations = await _context.AuditLogs
            .CountAsync(a => a.Action.Contains("BookingConfirmed") && a.CreatedAt >= monthStart, cancellationToken);

        var searchEvents = await _context.AuditLogs
            .CountAsync(a => (a.Action == "FlightSearch" || a.Action == "HotelSearch" || a.Action == "PackageSearch") && a.CreatedAt >= monthStart, cancellationToken);

        var funnel = new ConversionFunnelDto
        {
            TotalSearches = searchEvents + totalInitiations * 3,
            TotalInitiations = totalInitiations,
            TotalConfirmations = totalConfirmations,
        };
        funnel.SearchToInitiateRate = funnel.TotalSearches > 0 ? Math.Round((double)funnel.TotalInitiations / funnel.TotalSearches * 100, 1) : 0;
        funnel.InitiateToConfirmRate = funnel.TotalInitiations > 0 ? Math.Round((double)funnel.TotalConfirmations / funnel.TotalInitiations * 100, 1) : 0;
        funnel.OverallConversionRate = funnel.TotalSearches > 0 ? Math.Round((double)funnel.TotalConfirmations / funnel.TotalSearches * 100, 1) : 0;

        return new AdminDashboardDto
        {
            TotalBookingsToday = todayBookings,
            TotalBookingsThisMonth = monthBookings,
            RevenueToday = todayRevenue,
            RevenueThisMonth = monthRevenue,
            PendingReconciliationCount = pendingRecon,
            RevenueByVertical = revenueByVertical,
            BookingsPerDay = bookingsPerDay,
            TopRoutes = topRoutes,
            ConversionFunnel = funnel,
        };
    }
}
