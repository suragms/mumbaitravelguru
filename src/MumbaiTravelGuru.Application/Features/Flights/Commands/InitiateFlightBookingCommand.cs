using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Flight;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;
using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Application.Features.Flights.Commands;

public record InitiateFlightBookingCommand(
    string OfferId,
    List<TravelerDetailDto> Travelers
) : IRequest<InitiateBookingResultDto>;

public class InitiateFlightBookingCommandValidator : AbstractValidator<InitiateFlightBookingCommand>
{
    public InitiateFlightBookingCommandValidator()
    {
        RuleFor(v => v.OfferId).NotEmpty();
        RuleFor(v => v.Travelers).NotEmpty();
    }
}

public class InitiateFlightBookingCommandHandler : IRequestHandler<InitiateFlightBookingCommand, InitiateBookingResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IFlightSupplierAdapter _supplier;
    private readonly IFareLockStore _fareLockStore;
    private readonly IDateTime _dateTime;

    public InitiateFlightBookingCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IFlightSupplierAdapter supplier,
        IFareLockStore fareLockStore,
        IDateTime dateTime)
    {
        _context = context;
        _currentUser = currentUser;
        _supplier = supplier;
        _fareLockStore = fareLockStore;
        _dateTime = dateTime;
    }

    public async Task<InitiateBookingResultDto> Handle(InitiateFlightBookingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("User not authenticated.");

        var offer = await _supplier.GetOfferByIdAsync(request.OfferId, cancellationToken);

        if (offer == null || offer.SeatsAvailable <= 0)
            return new InitiateBookingResultDto { Succeeded = false, Error = "This fare is no longer available." };

        if (offer.PriceExpiryUtc < _dateTime.UtcNow)
            return new InitiateBookingResultDto { Succeeded = false, Error = "Fare has expired. Please search again." };

        var paxTotal = request.Travelers.Count;
        if (paxTotal > offer.SeatsAvailable)
            return new InitiateBookingResultDto { Succeeded = false, Error = "Not enough seats available." };

        // Re-validate: ignore client-supplied price — use server-fetched price
        // The offer from supplier has the authoritative price.
        // We create a FareLock with the server-side price.
        var searchCriteria = new FlightSearchCriteria
        {
            Origin = offer.OutboundSegments.FirstOrDefault()?.DepartureAirportCode ?? "",
            Destinations = new List<string> { offer.OutboundSegments.LastOrDefault()?.ArrivalAirportCode ?? "" },
            Adults = 1,
        };

        var fareLock = await _supplier.LockFareAsync(request.OfferId, searchCriteria, cancellationToken);

        if (fareLock == null)
            return new InitiateBookingResultDto { Succeeded = false, Error = "Unable to lock fare. Please try again." };

        _fareLockStore.Add(fareLock);

        var booking = new Booking
        {
            UserId = userId,
            BookingType = BookingType.Flight,
            Status = BookingStatus.Pending,
            TotalAmount = fareLock.LockedPrice,
            PaidAmount = 0,
            Currency = fareLock.Currency,
        };

        _context.Bookings.Add(booking);

        var firstSeg = offer.OutboundSegments.FirstOrDefault();
        var lastSeg = offer.OutboundSegments.LastOrDefault();
        var lastSegList = offer.ReturnSegments.LastOrDefault();

        var flightDetail = new FlightBookingDetail
        {
            BookingId = booking.Id,
            FareLockId = fareLock.LockId,
            OfferId = request.OfferId,
            TripType = TripType.OneWay,
            CabinClass = CabinClass.Economy,
            OriginAirport = firstSeg?.DepartureAirportCode ?? "",
            DestinationAirport = lastSeg?.ArrivalAirportCode ?? "",
            DepartureDate = firstSeg?.DepartureTime,
            ReturnDate = lastSegList?.ArrivalTime,
            Adults = request.Travelers.Count,
            Children = 0,
            Infants = 0,
            ActionStatus = BookingActionStatus.FareLocked,
        };

        _context.Set<FlightBookingDetail>().Add(flightDetail);

        foreach (var seg in offer.OutboundSegments.Concat(offer.ReturnSegments))
        {
            _context.Set<FlightBookingSegment>().Add(new FlightBookingSegment
            {
                FlightBookingDetailId = flightDetail.Id,
                DepartureAirportCode = seg.DepartureAirportCode,
                ArrivalAirportCode = seg.ArrivalAirportCode,
                DepartureTime = seg.DepartureTime,
                ArrivalTime = seg.ArrivalTime,
                Airline = seg.Airline,
                FlightNumber = seg.FlightNumber,
                Cabin = seg.Cabin.ToString(),
                DurationMinutes = seg.DurationMinutes,
            });
        }

        foreach (var traveler in request.Travelers)
        {
            _context.Set<FlightBookingPassenger>().Add(new FlightBookingPassenger
            {
                FlightBookingDetailId = flightDetail.Id,
                FirstName = traveler.FirstName,
                LastName = traveler.LastName,
                PhoneNumber = traveler.PhoneNumber,
                Email = traveler.Email,
                DateOfBirth = traveler.DateOfBirth,
                Gender = traveler.Gender,
                PassportNumber = traveler.PassportNumber,
                Nationality = traveler.Nationality,
            });
        }

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "FlightBookingInitiated",
            UserId = userId,
            Details = $"Initiated flight booking. Offer:{request.OfferId} Lock:{fareLock.LockId} Price:{fareLock.LockedPrice}",
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new InitiateBookingResultDto
        {
            Succeeded = true,
            LockId = fareLock.LockId,
            LockedPrice = fareLock.LockedPrice,
            Currency = fareLock.Currency,
            ExpiresAtUtc = fareLock.ExpiresAtUtc,
            BookingId = booking.Id.ToString(),
        };
    }
}
