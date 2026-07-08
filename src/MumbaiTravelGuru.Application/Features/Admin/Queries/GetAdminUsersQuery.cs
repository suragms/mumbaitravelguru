using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;

namespace MumbaiTravelGuru.Application.Features.Admin.Queries;

public record GetAdminUsersQuery(string? Search, int Page = 1, int PageSize = 20) : IRequest<AdminUsersResult>;

public class AdminUsersResult
{
    public List<AdminUserDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class GetAdminUsersQueryHandler : IRequestHandler<GetAdminUsersQuery, AdminUsersResult>
{
    private readonly IApplicationDbContext _context;

    public GetAdminUsersQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<AdminUsersResult> Handle(GetAdminUsersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Where(u => !u.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.ToLower();
            query = query.Where(u =>
                u.Email.ToLower().Contains(s) ||
                u.FirstName.ToLower().Contains(s) ||
                u.LastName.ToLower().Contains(s) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(s)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                PhoneNumber = u.PhoneNumber,
                IsEmailVerified = u.IsEmailVerified,
                LastLoginAt = u.LastLoginAt,
                CreatedAt = u.CreatedAt,
                Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList(),
            })
            .ToListAsync(cancellationToken);

        return new AdminUsersResult { Items = items, TotalCount = totalCount, Page = request.Page, PageSize = request.PageSize };
    }
}
