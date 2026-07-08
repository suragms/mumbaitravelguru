using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.Hotel;
using MumbaiTravelGuru.Application.Features.Hotels.Queries;

namespace MumbaiTravelGuru.API.Controllers;

public class HotelsController : ApiControllerBase
{
    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<List<HotelOfferDto>>> Search(
        [FromQuery] string city,
        [FromQuery] DateTime checkIn,
        [FromQuery] DateTime checkOut,
        [FromQuery] int rooms = 1,
        [FromQuery] int adults = 1,
        [FromQuery] int children = 0,
        [FromQuery] int? minStarRating = null,
        [FromQuery] decimal? maxPricePerNight = null)
    {
        var query = new SearchHotelsQuery(city, checkIn, checkOut, rooms, adults, children, minStarRating, maxPricePerNight);
        return Ok(await Mediator.Send(query));
    }

    [HttpGet("{hotelId}")]
    [AllowAnonymous]
    public async Task<ActionResult<HotelOfferDto>> GetDetail(string hotelId)
    {
        var query = new GetHotelDetailQuery(hotelId);
        return Ok(await Mediator.Send(query));
    }

    [HttpGet("{hotelId}/reviews")]
    [AllowAnonymous]
    public async Task<ActionResult<List<GuestReviewDto>>> GetReviews(string hotelId)
    {
        var query = new GetHotelReviewsQuery(hotelId);
        return Ok(await Mediator.Send(query));
    }
}
