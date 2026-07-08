using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Auth;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Features.Auth.Commands;

public record RegisterUserCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string PhoneNumber) : IRequest<AuthResult>;

public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(v => v.Email).NotEmpty().EmailAddress();
        RuleFor(v => v.Password).NotEmpty().MinimumLength(6);
        RuleFor(v => v.FirstName).NotEmpty().MaximumLength(50);
        RuleFor(v => v.LastName).NotEmpty().MaximumLength(50);
        RuleFor(v => v.PhoneNumber).NotEmpty();
    }
}

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, AuthResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IDateTime _dateTime;

    public RegisterUserCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IDateTime dateTime)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
        _dateTime = dateTime;
    }

    public async Task<AuthResult> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        var emailNormalized = request.Email.Trim().ToLowerInvariant();

        if (await _context.Users.AnyAsync(u => u.Email == emailNormalized, cancellationToken))
            return new AuthResult { Succeeded = false, Error = "User with this email already exists." };

        var customerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Customer", cancellationToken)
            ?? new Role { Name = "Customer", Description = "Default customer role" };

        var user = new User
        {
            Email = emailNormalized,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
        };

        var wallet = new Domain.Entities.Wallet
        {
            UserId = user.Id,
            Currency = "INR",
        };

        user.Wallet = wallet;

        if (customerRole.Id == Guid.Empty)
            _context.Roles.Add(customerRole);

        var userRole = new UserRole
        {
            UserId = user.Id,
            RoleId = customerRole.Id,
        };

        user.UserRoles.Add(userRole);

        _context.Users.Add(user);
        _context.Wallets.Add(wallet);

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "UserRegister",
            UserId = user.Id,
            UserEmail = user.Email,
            Details = "Registered a new customer account with wallet.",
        });

        await _context.SaveChangesAsync(cancellationToken);

        var roles = new List<string> { "Customer" };
        var token = _jwtTokenService.GenerateAccessToken(user, roles);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = _dateTime.UtcNow.AddMinutes(_jwtTokenService.GetRefreshTokenExpiryMinutes());

        return new AuthResult
        {
            Succeeded = true,
            Token = token,
            RefreshToken = refreshToken,
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
