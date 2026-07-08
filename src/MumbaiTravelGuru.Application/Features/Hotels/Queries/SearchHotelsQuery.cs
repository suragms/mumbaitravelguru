using FluentValidation;
using MediatR;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Hotel;
using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Application.Features.Hotels.Queries;

public record SearchHotelsQuery(
    string City,
    DateTime CheckIn,
    DateTime CheckOut,
    int Rooms,
    int Adults,
    int Children,
    int? MinStarRating,
    decimal? MaxPricePerNight
) : IRequest<List<HotelOfferDto>>;

public class SearchHotelsQueryValidator : AbstractValidator<SearchHotelsQuery>
{
    public SearchHotelsQueryValidator()
    {
        RuleFor(v => v.City).NotEmpty();
        RuleFor(v => v.CheckIn).NotEmpty();
        RuleFor(v => v.CheckOut).GreaterThan(v => v.CheckIn);
        RuleFor(v => v.Adults).GreaterThan(0);
        RuleFor(v => v.Rooms).GreaterThan(0);
    }
}

public class SearchHotelsQueryHandler : IRequestHandler<SearchHotelsQuery, List<HotelOfferDto>>
{
    private readonly IHotelSupplierAdapter _supplier;

    public SearchHotelsQueryHandler(IHotelSupplierAdapter supplier) => _supplier = supplier;

    public async Task<List<HotelOfferDto>> Handle(SearchHotelsQuery request, CancellationToken cancellationToken)
    {
        var criteria = new HotelSearchCriteria
        {
            City = request.City,
            CheckIn = request.CheckIn.ToUniversalTime(),
            CheckOut = request.CheckOut.ToUniversalTime(),
            Rooms = request.Rooms,
            Adults = request.Adults,
            Children = request.Children,
            MinStarRating = request.MinStarRating,
            MaxPricePerNight = request.MaxPricePerNight,
        };

        var offers = await _supplier.SearchHotelsAsync(criteria, cancellationToken);

        return offers.Select(MapOffer).ToList();
    }

    internal static HotelOfferDto MapOffer(HotelOffer o) => new()
    {
        OfferId = o.OfferId,
        HotelId = o.HotelId,
        Name = o.Name,
        Description = o.Description,
        City = o.City,
        Country = o.Country,
        Address = o.Address,
        Latitude = o.Latitude,
        Longitude = o.Longitude,
        StarRating = o.StarRating,
        GuestRating = o.GuestRating,
        ReviewCount = o.ReviewCount,
        PhotoUrls = o.PhotoUrls,
        Amenities = o.Amenities,
        Policies = o.Policies,
        Rooms = o.Rooms.Select(r => new HotelRoomOfferDto
        {
            RoomId = r.RoomId,
            RoomType = r.RoomType,
            Description = r.Description,
            MaxAdults = r.MaxAdults,
            MaxChildren = r.MaxChildren,
            TotalRoomsAvailable = r.TotalRoomsAvailable,
            PricePerNight = r.PricePerNight,
            TotalPrice = r.TotalPrice,
            Currency = r.Currency,
            BoardType = r.BoardType,
            IsRefundable = r.IsRefundable,
            CancellationPolicy = r.CancellationPolicy,
            RoomAmenities = r.RoomAmenities,
        }).ToList(),
        TotalPrice = o.TotalPrice,
        Currency = o.Currency,
        PriceExpiryUtc = o.PriceExpiryUtc,
    };
}
