using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Auth;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Features.Auth.Commands;

public record RefreshTokenCommand(string Token, string RefreshToken) : IRequest<AuthResult>;

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(v => v.Token).NotEmpty();
        RuleFor(v => v.RefreshToken).NotEmpty();
    }
}

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IDateTime _dateTime;

    public RefreshTokenCommandHandler(
        IApplicationDbContext context,
        IJwtTokenService jwtTokenService,
        IDateTime dateTime)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _dateTime = dateTime;
    }

    public async Task<AuthResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var principal = _jwtTokenService.GetPrincipalFromExpiredToken(request.Token);

        if (principal == null)
            return new AuthResult { Succeeded = false, Error = "Invalid token." };

        var userIdClaim = principal.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return new AuthResult { Succeeded = false, Error = "Invalid token payload." };

        var user = await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);

        if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiry < _dateTime.UtcNow)
            return new AuthResult { Succeeded = false, Error = "Invalid or expired refresh token." };

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var newToken = _jwtTokenService.GenerateAccessToken(user, roles);
        var newRefreshToken = _jwtTokenService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = _dateTime.UtcNow.AddMinutes(_jwtTokenService.GetRefreshTokenExpiryMinutes());

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "TokenRefresh",
            UserId = user.Id,
            UserEmail = user.Email,
            Details = "Access token refreshed.",
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResult
        {
            Succeeded = true,
            Token = newToken,
            RefreshToken = newRefreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                Roles = roles,
                CreatedAt = user.CreatedAt,
            },
        };
    }
}
