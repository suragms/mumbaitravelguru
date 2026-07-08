using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Auth;
using MumbaiTravelGuru.Domain.Constants;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Features.Auth.Commands;

public record VerifyOtpCommand(string PhoneNumber, string Otp) : IRequest<AuthResult>;

public class VerifyOtpCommandValidator : AbstractValidator<VerifyOtpCommand>
{
    public VerifyOtpCommandValidator()
    {
        RuleFor(v => v.PhoneNumber).NotEmpty();
        RuleFor(v => v.Otp).NotEmpty().Length(6);
    }
}

public class VerifyOtpCommandHandler : IRequestHandler<VerifyOtpCommand, AuthResult>
{
    private readonly IApplicationDbContext _context;
    private readonly IOtpService _otpService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IDateTime _dateTime;

    public VerifyOtpCommandHandler(
        IApplicationDbContext context,
        IOtpService otpService,
        IJwtTokenService jwtTokenService,
        IDateTime dateTime)
    {
        _context = context;
        _otpService = otpService;
        _jwtTokenService = jwtTokenService;
        _dateTime = dateTime;
    }

    public async Task<AuthResult> Handle(VerifyOtpCommand request, CancellationToken cancellationToken)
    {
        if (!_otpService.ValidateOtp(request.PhoneNumber, request.Otp))
            return new AuthResult { Succeeded = false, Error = "Invalid or expired OTP." };

        var user = await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.PhoneNumber == request.PhoneNumber && !u.IsDeleted, cancellationToken);

        if (user == null)
        {
            var customerRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == Roles.Customer, cancellationToken)
                ?? new Role { Name = Roles.Customer, Description = "Default customer role" };

            user = new User
            {
                PhoneNumber = request.PhoneNumber,
                IsEmailVerified = false,
            };

            if (customerRole.Id == Guid.Empty)
                _context.Roles.Add(customerRole);

            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = customerRole.Id });

            var wallet = new Domain.Entities.Wallet { UserId = user.Id };
            user.Wallet = wallet;
            _context.Wallets.Add(wallet);

            _context.Users.Add(user);
        }

        user.LastLoginAt = _dateTime.UtcNow;

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var token = _jwtTokenService.GenerateAccessToken(user, roles);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = _dateTime.UtcNow.AddMinutes(_jwtTokenService.GetRefreshTokenExpiryMinutes());

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "OtpLogin",
            UserId = user.Id,
            UserEmail = user.Email ?? request.PhoneNumber,
            Details = $"Logged in via OTP to {request.PhoneNumber}.",
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResult
        {
            Succeeded = true,
            Token = token,
            RefreshToken = refreshToken,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                Roles = roles,
                CreatedAt = user.CreatedAt,
            },
        };
    }
}
