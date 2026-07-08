using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;

namespace MumbaiTravelGuru.Application.Features.SavedTravelers.Commands;

public record DeleteSavedTravelerCommand(Guid Id) : IRequest<bool>;

public class DeleteSavedTravelerCommandValidator : AbstractValidator<DeleteSavedTravelerCommand>
{
    public DeleteSavedTravelerCommandValidator()
    {
        RuleFor(v => v.Id).NotEmpty();
    }
}

public class DeleteSavedTravelerCommandHandler : IRequestHandler<DeleteSavedTravelerCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public DeleteSavedTravelerCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<bool> Handle(DeleteSavedTravelerCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("User not authenticated.");

        var traveler = await _context.SavedTravelers
            .FirstOrDefaultAsync(st => st.Id == request.Id && st.UserId == userId && !st.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Saved traveler not found.");

        traveler.MarkAsDeleted();
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
