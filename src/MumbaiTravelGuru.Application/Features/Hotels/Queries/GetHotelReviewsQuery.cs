using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Hotel;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Features.Hotels.Queries;

public record GetHotelReviewsQuery(string HotelId) : IRequest<List<GuestReviewDto>>;

public class GetHotelReviewsQueryHandler : IRequestHandler<GetHotelReviewsQuery, List<GuestReviewDto>>
{
    private readonly IApplicationDbContext _context;

    public GetHotelReviewsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<List<GuestReviewDto>> Handle(GetHotelReviewsQuery request, CancellationToken cancellationToken)
    {
        var reviews = await _context.Set<GuestReview>()
            .Include(r => r.User)
            .Where(r => r.HotelId == request.HotelId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return reviews.Select(r => new GuestReviewDto
        {
            ReviewId = r.Id.ToString(),
            UserName = $"{r.User.FirstName} {r.User.LastName}",
            Rating = r.Rating,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt,
        }).ToList();
    }
}
