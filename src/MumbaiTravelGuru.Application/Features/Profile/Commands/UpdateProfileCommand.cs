using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Auth;

namespace MumbaiTravelGuru.Application.Features.Profile.Commands;

public record UpdateProfileCommand(string FirstName, string LastName, string PhoneNumber) : IRequest<UserDto>;

public class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        RuleFor(v => v.FirstName).NotEmpty().MaximumLength(50);
        RuleFor(v => v.LastName).NotEmpty().MaximumLength(50);
        RuleFor(v => v.PhoneNumber).NotEmpty();
    }
}

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, UserDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateProfileCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<UserDto> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("User not authenticated.");

        var user = await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.PhoneNumber = request.PhoneNumber.Trim();

        await _context.SaveChangesAsync(cancellationToken);

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber ?? string.Empty,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
            CreatedAt = user.CreatedAt,
        };
    }
}
