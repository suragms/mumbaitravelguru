using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.SavedTraveler;

namespace MumbaiTravelGuru.Application.Features.SavedTravelers.Queries;

public record GetSavedTravelersQuery : IRequest<List<SavedTravelerDto>>;

public class GetSavedTravelersQueryHandler : IRequestHandler<GetSavedTravelersQuery, List<SavedTravelerDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetSavedTravelersQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<SavedTravelerDto>> Handle(GetSavedTravelersQuery request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("User not authenticated.");

        var travelers = await _context.SavedTravelers
            .Where(st => st.UserId == userId && !st.IsDeleted)
            .OrderBy(st => st.FirstName)
            .Select(st => new SavedTravelerDto
            {
                Id = st.Id,
                FirstName = st.FirstName,
                LastName = st.LastName,
                PhoneNumber = st.PhoneNumber,
                DateOfBirth = st.DateOfBirth,
                Gender = st.Gender,
                PassportNumber = st.PassportNumber,
                FrequentFlyerNumber = st.FrequentFlyerNumber,
                Nationality = st.Nationality,
                IsPrimary = st.IsPrimary,
                CreatedAt = st.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        foreach (var t in travelers)
        {
            if (t.PassportNumber?.Length >= 4)
                t.PassportNumber = "****" + t.PassportNumber[^4..];
        }

        return travelers;
    }
}
