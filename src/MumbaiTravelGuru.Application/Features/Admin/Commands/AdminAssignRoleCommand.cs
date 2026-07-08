using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Behaviours;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Features.Admin.Commands;

[AdminAction("AdminAssignRole", "Admin assigned role to user", EntityType = "User", EntityIdProperty = "UserId", LogRequest = true)]
public record AdminAssignRoleCommand(Guid UserId, string Role) : IRequest<AdminAssignRoleResult>;

public class AdminAssignRoleResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
}

public class AdminAssignRoleCommandValidator : AbstractValidator<AdminAssignRoleCommand>
{
    public AdminAssignRoleCommandValidator()
    {
        RuleFor(v => v.UserId).NotEmpty();
        RuleFor(v => v.Role).NotEmpty().Must(r => Domain.Constants.Roles.All.Contains(r));
    }
}

public class AdminAssignRoleCommandHandler : IRequestHandler<AdminAssignRoleCommand, AdminAssignRoleResult>
{
    private readonly IApplicationDbContext _context;

    public AdminAssignRoleCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<AdminAssignRoleResult> Handle(AdminAssignRoleCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == request.UserId && !u.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        var role = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name == request.Role, cancellationToken)
            ?? throw new InvalidOperationException($"Role '{request.Role}' not found.");

        if (user.UserRoles.Any(ur => ur.Role.Name == request.Role))
            return new AdminAssignRoleResult { Succeeded = false, Error = "User already has this role." };

        user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });

        await _context.SaveChangesAsync(cancellationToken);
        return new AdminAssignRoleResult { Succeeded = true };
    }
}
