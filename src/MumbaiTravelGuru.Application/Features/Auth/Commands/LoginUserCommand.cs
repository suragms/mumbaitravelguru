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
    public record LoginUserCommand(string Email, string Password) : IRequest<AuthResult>;

    public class LoginUserCommandValidator : AbstractValidator<LoginUserCommand>
    {
        public LoginUserCommandValidator()
        {
            RuleFor(v => v.Email).NotEmpty().EmailAddress();
            RuleFor(v => v.Password).NotEmpty();
        }
    }

    public class LoginUserCommandHandler : IRequestHandler<LoginUserCommand, AuthResult>
    {
        private readonly IApplicationDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IDateTime _dateTime;

        public LoginUserCommandHandler(
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

        public async Task<AuthResult> Handle(LoginUserCommand request, CancellationToken cancellationToken)
        {
            var emailNormalized = request.Email.Trim().ToLowerInvariant();
            
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == emailNormalized && !u.IsDeleted, cancellationToken);
            if (user == null)
            {
                return new AuthResult { Succeeded = false, Error = "Invalid email or password." };
            }

            var isPasswordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                return new AuthResult { Succeeded = false, Error = "Invalid email or password." };
            }

            var token = _jwtTokenService.GenerateAccessToken(user);
            var refreshToken = _jwtTokenService.GenerateRefreshToken();

            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                Action = "UserLogin",
                UserId = user.Id,
                UserEmail = user.Email,
                Details = "Successful login.",
                Timestamp = _dateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync(cancellationToken);

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
