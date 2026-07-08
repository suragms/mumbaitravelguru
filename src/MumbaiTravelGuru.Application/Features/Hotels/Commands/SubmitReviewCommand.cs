using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Hotel;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Hotels.Commands;

public record SubmitReviewCommand(Guid BookingId, int Rating, string Comment, string? HotelId, string? HotelName) : IRequest<GuestReviewDto>;

public class SubmitReviewCommandValidator : AbstractValidator<SubmitReviewCommand>
{
    public SubmitReviewCommandValidator()
    {
        RuleFor(v => v.BookingId).NotEmpty();
        RuleFor(v => v.Rating).InclusiveBetween(1, 5);
        RuleFor(v => v.Comment).NotEmpty().MaximumLength(2000);
    }
}

public class SubmitReviewCommandHandler : IRequestHandler<SubmitReviewCommand, GuestReviewDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTime _dateTime;

    public SubmitReviewCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser, IDateTime dateTime)
    {
        _context = context; _currentUser = currentUser; _dateTime = dateTime;
    }

    public async Task<GuestReviewDto> Handle(SubmitReviewCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException("User not authenticated.");

        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException("Booking not found.");

        if (booking.Status != BookingStatus.Completed)
            throw new InvalidOperationException("Reviews can only be submitted after the stay is completed.");

        var existing = await _context.Set<GuestReview>()
            .FirstOrDefaultAsync(r => r.BookingId == request.BookingId && r.UserId == userId, cancellationToken);

        if (existing != null)
            throw new InvalidOperationException("You have already submitted a review for this booking.");

        var review = new GuestReview
        {
            BookingId = request.BookingId,
            UserId = userId,
            Rating = request.Rating,
            Comment = request.Comment,
            HotelId = request.HotelId ?? string.Empty,
            HotelName = request.HotelName,
        };
        _context.Set<GuestReview>().Add(review);

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "ReviewSubmitted",
            UserId = userId,
            Details = $"Review submitted for booking {request.BookingId} hotel {request.HotelName} rating {request.Rating}",
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new GuestReviewDto
        {
            ReviewId = review.Id.ToString(),
            UserName = string.Empty,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt,
        };
    }
}
