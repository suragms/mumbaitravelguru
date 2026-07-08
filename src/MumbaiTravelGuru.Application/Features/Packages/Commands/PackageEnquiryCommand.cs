using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Package;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Features.Packages.Commands;

public record PackageEnquiryCommand(
    Guid? PackageId, string Name, string Email, string Phone,
    int Travelers, DateTime? PreferredStartDate, DateTime? PreferredEndDate, string Message
) : IRequest<PackageEnquiryResultDto>;

public class PackageEnquiryCommandValidator : AbstractValidator<PackageEnquiryCommand>
{
    public PackageEnquiryCommandValidator()
    {
        RuleFor(v => v.Name).NotEmpty().MaximumLength(100);
        RuleFor(v => v.Email).NotEmpty().EmailAddress().MaximumLength(150);
        RuleFor(v => v.Phone).NotEmpty().MaximumLength(20);
        RuleFor(v => v.Travelers).GreaterThan(0);
        RuleFor(v => v.Message).NotEmpty().MaximumLength(2000);
    }
}

public class PackageEnquiryCommandHandler : IRequestHandler<PackageEnquiryCommand, PackageEnquiryResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public PackageEnquiryCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context; _currentUser = currentUser;
    }

    public async Task<PackageEnquiryResultDto> Handle(PackageEnquiryCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return new PackageEnquiryResultDto { Succeeded = false, Error = "User not authenticated." };

        if (request.PackageId.HasValue)
        {
            var exists = await _context.Set<Package>()
                .AnyAsync(p => p.Id == request.PackageId.Value && p.IsActive, cancellationToken);
            if (!exists)
                return new PackageEnquiryResultDto { Succeeded = false, Error = "Package not found." };
        }

        var enquiry = new PackageEnquiry
        {
            UserId = userId.Value,
            PackageId = request.PackageId,
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            Travelers = request.Travelers,
            PreferredStartDate = request.PreferredStartDate,
            PreferredEndDate = request.PreferredEndDate,
            Message = request.Message,
        };
        _context.Set<PackageEnquiry>().Add(enquiry);

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "PackageEnquirySubmitted",
            UserId = userId.Value,
            Details = $"Enquiry for package {request.PackageId} - {request.Name} ({request.Travelers} travelers)",
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new PackageEnquiryResultDto { Succeeded = true, EnquiryId = enquiry.Id };
    }
}
