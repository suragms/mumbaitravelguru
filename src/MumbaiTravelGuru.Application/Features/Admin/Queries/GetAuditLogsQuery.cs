using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;

namespace MumbaiTravelGuru.Application.Features.Admin.Queries;

public record GetAuditLogsQuery(
    string? Action, string? UserEmail, string? EntityType,
    DateTime? DateFrom, DateTime? DateTo, int Page = 1, int PageSize = 50
) : IRequest<AuditLogsResult>;

public class AuditLogsResult
{
    public List<AdminAuditLogDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class GetAuditLogsQueryHandler : IRequestHandler<GetAuditLogsQuery, AuditLogsResult>
{
    private readonly IApplicationDbContext _context;

    public GetAuditLogsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<AuditLogsResult> Handle(GetAuditLogsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.AuditLogs
            .Where(a => !a.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Action))
            query = query.Where(a => a.Action.Contains(request.Action));

        if (!string.IsNullOrWhiteSpace(request.UserEmail))
            query = query.Where(a => a.UserEmail != null && a.UserEmail.Contains(request.UserEmail));

        if (!string.IsNullOrWhiteSpace(request.EntityType))
            query = query.Where(a => a.EntityType == request.EntityType);

        if (request.DateFrom.HasValue)
            query = query.Where(a => a.CreatedAt >= request.DateFrom.Value);

        if (request.DateTo.HasValue)
            query = query.Where(a => a.CreatedAt <= request.DateTo.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new AdminAuditLogDto
            {
                Id = a.Id,
                Action = a.Action,
                UserId = a.UserId,
                UserEmail = a.UserEmail,
                Details = a.Details,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                CreatedAt = a.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        return new AuditLogsResult { Items = items, TotalCount = totalCount, Page = request.Page, PageSize = request.PageSize };
    }
}
