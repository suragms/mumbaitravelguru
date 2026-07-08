using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.SavedTraveler;

namespace MumbaiTravelGuru.Application.Features.SavedTravelers.Queries;

public record GetSavedTravelerByIdQuery(Guid Id) : IRequest<SavedTravelerDto>;

public class GetSavedTravelerByIdQueryValidator : AbstractValidator<GetSavedTravelerByIdQuery>
{
    public GetSavedTravelerByIdQueryValidator()
    {
        RuleFor(v => v.Id).NotEmpty();
    }
}

public class GetSavedTravelerByIdQueryHandler : IRequestHandler<GetSavedTravelerByIdQuery, SavedTravelerDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetSavedTravelerByIdQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<SavedTravelerDto> Handle(GetSavedTravelerByIdQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("User not authenticated.");

        var traveler = await _context.SavedTravelers
            .FirstOrDefaultAsync(st => st.Id == request.Id && st.UserId == userId && !st.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Saved traveler not found.");

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
