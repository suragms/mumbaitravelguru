using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Package;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Packages.Commands;

public record InitiatePackageBookingCommand(
    Guid PackageId, Guid? FixedDepartureId, int Travelers
) : IRequest<InitiatePackageBookingResultDto>;

public class InitiatePackageBookingCommandValidator : AbstractValidator<InitiatePackageBookingCommand>
{
    public InitiatePackageBookingCommandValidator()
    {
        RuleFor(v => v.PackageId).NotEmpty();
        RuleFor(v => v.Travelers).GreaterThan(0);
    }
}

public class InitiatePackageBookingCommandHandler : IRequestHandler<InitiatePackageBookingCommand, InitiatePackageBookingResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IDateTime _dateTime;

    public InitiatePackageBookingCommandHandler(
        IApplicationDbContext context, ICurrentUserService currentUser, IDateTime dateTime)
    {
        _context = context; _currentUser = currentUser; _dateTime = dateTime;
    }

    public async Task<InitiatePackageBookingResultDto> Handle(InitiatePackageBookingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException("User not authenticated.");

        var package = await _context.Set<Package>()
            .FirstOrDefaultAsync(p => p.Id == request.PackageId && p.IsActive, cancellationToken)
            ?? throw new InvalidOperationException("Package not found.");

        if (!package.IsFixedDeparture)
            return new InitiatePackageBookingResultDto { Succeeded = false, Error = "This package is not bookable online. Please submit an enquiry." };

        decimal pricePerPerson;
        if (request.FixedDepartureId.HasValue)
        {
            var departure = await _context.Set<FixedDeparture>()
                .FirstOrDefaultAsync(fd => fd.Id == request.FixedDepartureId.Value && fd.IsActive, cancellationToken)
                ?? throw new InvalidOperationException("Fixed departure not found.");

            if (departure.AvailableSpots < request.Travelers)
                return new InitiatePackageBookingResultDto { Succeeded = false, Error = "Not enough spots available." };

            pricePerPerson = departure.DiscountedPricePerPerson ?? departure.PricePerPerson;
            departure.AvailableSpots -= request.Travelers;
        }
        else
        {
            pricePerPerson = package.DiscountedPricePerPerson ?? package.PricePerPerson;
        }

        var totalPrice = pricePerPerson * request.Travelers;
        var initialPayment = totalPrice * 25 / 100; // 25% upfront

        var booking = new Booking
        {
            UserId = userId,
            BookingType = BookingType.Package,
            Status = BookingStatus.Pending,
            TotalAmount = totalPrice,
            PaidAmount = 0,
            Currency = package.Currency,
        };
        _context.Bookings.Add(booking);

        var detail = new PackageBookingDetail
        {
            BookingId = booking.Id,
            PackageId = request.PackageId,
            FixedDepartureId = request.FixedDepartureId,
            Travelers = request.Travelers,
            PricePerPerson = pricePerPerson,
            TotalPrice = totalPrice,
            AmountPaid = 0,
            Currency = package.Currency,
            ActionStatus = "Initiated",
        };
        _context.Set<PackageBookingDetail>().Add(detail);

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "PackageBookingInitiated",
            UserId = userId,
            Details = $"Package booking initiated. Package:{package.Name} Travelers:{request.Travelers} Total:{totalPrice}",
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new InitiatePackageBookingResultDto
        {
            Succeeded = true,
            BookingId = booking.Id,
            TotalPrice = totalPrice,
            InitialPayment = initialPayment,
            Currency = package.Currency,
        };
    }
}
