using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Flight;
using MumbaiTravelGuru.Application.DTOs.Hotel;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;
using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Application.Features.Hotels.Commands;

public record InitiateHotelBookingCommand(
    string OfferId,
    string RoomId,
    int RoomQuantity,
    List<TravelerDetailDto> Travelers
) : IRequest<InitiateHotelBookingResultDto>;

public class InitiateHotelBookingCommandValidator : AbstractValidator<InitiateHotelBookingCommand>
{
    public InitiateHotelBookingCommandValidator()
    {
        RuleFor(v => v.OfferId).NotEmpty();
        RuleFor(v => v.RoomId).NotEmpty();
        RuleFor(v => v.RoomQuantity).GreaterThan(0);
        RuleFor(v => v.Travelers).NotEmpty();
    }
}

public class InitiateHotelBookingCommandHandler : IRequestHandler<InitiateHotelBookingCommand, InitiateHotelBookingResultDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IHotelSupplierAdapter _supplier;
    private readonly IFareLockStore _fareLockStore;
    private readonly IDateTime _dateTime;

    public InitiateHotelBookingCommandHandler(
        IApplicationDbContext context, ICurrentUserService currentUser,
        IHotelSupplierAdapter supplier, IFareLockStore fareLockStore, IDateTime dateTime)
    {
        _context = context; _currentUser = currentUser; _supplier = supplier; _fareLockStore = fareLockStore; _dateTime = dateTime;
    }

    public async Task<InitiateHotelBookingResultDto> Handle(InitiateHotelBookingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException("User not authenticated.");

        var offer = await _supplier.GetOfferByIdAsync(request.OfferId, cancellationToken);

        if (offer == null)
            return new InitiateHotelBookingResultDto { Succeeded = false, Error = "Hotel offer not found." };

        if (offer.PriceExpiryUtc < _dateTime.UtcNow)
            return new InitiateHotelBookingResultDto { Succeeded = false, Error = "Rates have expired. Please search again." };

        var room = offer.Rooms.FirstOrDefault(r => r.RoomId == request.RoomId);
        if (room == null)
            return new InitiateHotelBookingResultDto { Succeeded = false, Error = "Selected room not available." };

        if (room.TotalRoomsAvailable < request.RoomQuantity)
            return new InitiateHotelBookingResultDto { Succeeded = false, Error = "Not enough rooms available." };

        // Re-validation: use server-side price, never client input
        var criteria = new HotelSearchCriteria
        {
            City = offer.City,
            CheckIn = _dateTime.UtcNow.AddDays(7),
            CheckOut = _dateTime.UtcNow.AddDays(10),
            Adults = request.Travelers.Count,
        };

        var fareLock = await _supplier.LockRateAsync(request.OfferId, request.RoomId, criteria, cancellationToken);
        if (fareLock == null)
            return new InitiateHotelBookingResultDto { Succeeded = false, Error = "Unable to lock rate. Try again." };

        _fareLockStore.Add(fareLock);

        var totalPrice = room.TotalPrice * request.RoomQuantity;

        var booking = new Booking
        {
            UserId = userId,
            BookingType = BookingType.Hotel,
            Status = BookingStatus.Pending,
            TotalAmount = fareLock.LockedPrice,
            PaidAmount = 0,
            Currency = fareLock.Currency,
        };
        _context.Bookings.Add(booking);

        var nights = (int)((criteria.CheckOut - criteria.CheckIn).TotalDays);
        if (nights <= 0) nights = 1;

        var detail = new HotelBookingDetail
        {
            BookingId = booking.Id,
            FareLockId = fareLock.LockId,
            OfferId = request.OfferId,
            HotelId = offer.HotelId,
            HotelName = offer.Name,
            HotelAddress = offer.Address,
            City = offer.City,
            Country = offer.Country,
            StarRating = offer.StarRating,
            CheckIn = criteria.CheckIn,
            CheckOut = criteria.CheckOut,
            NumberOfNights = nights,
            Rooms = request.RoomQuantity,
            Adults = request.Travelers.Count,
            Children = 0,
            BoardType = room.BoardType,
            CancellationPolicy = room.CancellationPolicy,
            ActionStatus = "FareLocked",
        };
        _context.Set<HotelBookingDetail>().Add(detail);

        _context.Set<HotelBookedRoom>().Add(new HotelBookedRoom
        {
            HotelBookingDetailId = detail.Id,
            RoomType = room.RoomType,
            BoardType = room.BoardType,
            Quantity = request.RoomQuantity,
            PricePerNight = room.PricePerNight,
            TotalPrice = totalPrice,
        });

        _context.AuditLogs.Add(new AuditLog
        {
            Action = "HotelBookingInitiated",
            UserId = userId,
            Details = $"Initiated hotel booking. Hotel:{offer.Name} Room:{room.RoomType} Lock:{fareLock.LockId}",
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new InitiateHotelBookingResultDto
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
