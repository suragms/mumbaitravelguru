using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.SavedTraveler;

namespace MumbaiTravelGuru.Application.Features.SavedTravelers.Commands;

public record UpdateSavedTravelerCommand(
    Guid Id,
    string FirstName,
    string LastName,
    string? PhoneNumber,
    DateOnly? DateOfBirth,
    string? Gender,
    string? PassportNumber,
    string? FrequentFlyerNumber,
    string? Nationality,
    bool IsPrimary) : IRequest<SavedTravelerDto>;

public class UpdateSavedTravelerCommandValidator : AbstractValidator<UpdateSavedTravelerCommand>
{
    public UpdateSavedTravelerCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty();
        RuleFor(v => v.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(v => v.LastName).NotEmpty().MaximumLength(100);
        RuleFor(v => v.PhoneNumber).MaximumLength(20);
        RuleFor(v => v.Gender).MaximumLength(10);
        RuleFor(v => v.PassportNumber).MaximumLength(20);
        RuleFor(v => v.FrequentFlyerNumber).MaximumLength(50);
        RuleFor(v => v.Nationality).MaximumLength(50);
    }
}

public class UpdateSavedTravelerCommandHandler : IRequestHandler<UpdateSavedTravelerCommand, SavedTravelerDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateSavedTravelerCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<SavedTravelerDto> Handle(UpdateSavedTravelerCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("User not authenticated.");

        var traveler = await _context.SavedTravelers
            .FirstOrDefaultAsync(st => st.Id == request.Id && st.UserId == userId && !st.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Saved traveler not found.");

        if (request.IsPrimary && !traveler.IsPrimary)
        {
            var existing = await _context.SavedTravelers
                .Where(st => st.UserId == userId && st.IsPrimary && !st.IsDeleted)
                .ToListAsync(cancellationToken);
            foreach (var item in existing)
                item.IsPrimary = false;
        }

        traveler.FirstName = request.FirstName.Trim();
        traveler.LastName = request.LastName.Trim();
        traveler.PhoneNumber = request.PhoneNumber?.Trim();
        traveler.DateOfBirth = request.DateOfBirth;
        traveler.Gender = request.Gender;
        traveler.PassportNumber = request.PassportNumber?.Trim();
        traveler.FrequentFlyerNumber = request.FrequentFlyerNumber?.Trim();
        traveler.Nationality = request.Nationality?.Trim();
        traveler.IsPrimary = request.IsPrimary;

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
