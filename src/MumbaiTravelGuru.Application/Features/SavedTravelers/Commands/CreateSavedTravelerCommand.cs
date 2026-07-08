using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.SavedTraveler;

namespace MumbaiTravelGuru.Application.Features.SavedTravelers.Commands;

public record CreateSavedTravelerCommand(
    string FirstName,
    string LastName,
    string? PhoneNumber,
    DateOnly? DateOfBirth,
    string? Gender,
    string? PassportNumber,
    string? FrequentFlyerNumber,
    string? Nationality,
    bool IsPrimary) : IRequest<SavedTravelerDto>;

public class CreateSavedTravelerCommandValidator : AbstractValidator<CreateSavedTravelerCommand>
{
    public CreateSavedTravelerCommandValidator()
    {
        RuleFor(v => v.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(v => v.LastName).NotEmpty().MaximumLength(100);
        RuleFor(v => v.PhoneNumber).MaximumLength(20);
        RuleFor(v => v.Gender).MaximumLength(10);
        RuleFor(v => v.PassportNumber).MaximumLength(20);
        RuleFor(v => v.FrequentFlyerNumber).MaximumLength(50);
        RuleFor(v => v.Nationality).MaximumLength(50);
    }
}

public class CreateSavedTravelerCommandHandler : IRequestHandler<CreateSavedTravelerCommand, SavedTravelerDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CreateSavedTravelerCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<SavedTravelerDto> Handle(CreateSavedTravelerCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("User not authenticated.");

        if (request.IsPrimary)
        {
            var existing = await _context.SavedTravelers
                .Where(st => st.UserId == userId && st.IsPrimary && !st.IsDeleted)
                .ToListAsync(cancellationToken);
            foreach (var item in existing)
                item.IsPrimary = false;
        }

        var traveler = new Domain.Entities.SavedTraveler
        {
            UserId = userId,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            PassportNumber = request.PassportNumber?.Trim(),
            FrequentFlyerNumber = request.FrequentFlyerNumber?.Trim(),
            Nationality = request.Nationality?.Trim(),
            IsPrimary = request.IsPrimary,
        };

        _context.SavedTravelers.Add(traveler);
        await _context.SaveChangesAsync(cancellationToken);

        return new SavedTravelerDto
        {
            Id = traveler.Id,
            FirstName = traveler.FirstName,
            LastName = traveler.LastName,
            PhoneNumber = traveler.PhoneNumber,
            DateOfBirth = traveler.DateOfBirth,
            Gender = traveler.Gender,
            PassportNumber = traveler.PassportNumber,
            FrequentFlyerNumber = traveler.FrequentFlyerNumber,
            Nationality = traveler.Nationality,
            IsPrimary = traveler.IsPrimary,
            CreatedAt = traveler.CreatedAt,
        };
    }
}
