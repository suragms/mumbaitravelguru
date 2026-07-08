using System;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Auth;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Features.Auth.Commands
{
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
            {
                return new AuthResult { Succeeded = false, Error = "User with this email already exists." };
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = emailNormalized,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                PhoneNumber = request.PhoneNumber.Trim(),
                Role = "Customer",
                CreatedAt = _dateTime.UtcNow
            };

            var wallet = new MumbaiTravelGuru.Domain.Entities.Wallet
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Currency = "INR"
            };
            
            user.Wallet = wallet;

            _context.Users.Add(user);
            _context.Wallets.Add(wallet);

            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                Action = "UserRegister",
                UserId = user.Id,
                UserEmail = user.Email,
                Details = "Successfully registered a new customer account and wallet.",
                Timestamp = _dateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync(cancellationToken);

            var token = _jwtTokenService.GenerateAccessToken(user);
            var refreshToken = _jwtTokenService.GenerateRefreshToken();

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
                    PhoneNumber = user.PhoneNumber,
                    Role = user.Role,
                    CreatedAt = user.CreatedAt
                }
            };
        }
    }
}
