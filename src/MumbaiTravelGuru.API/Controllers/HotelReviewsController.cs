using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.Hotel;
using MumbaiTravelGuru.Application.Features.Hotels.Commands;

namespace MumbaiTravelGuru.API.Controllers;

[Authorize]
public class HotelReviewsController : ApiControllerBase
{
    [HttpPost]
    public async Task<ActionResult<GuestReviewDto>> Submit([FromBody] SubmitReviewRequestDto request)
    {
        var command = new SubmitReviewCommand(
            request.BookingId,
            request.Rating,
            request.Comment,
            request.HotelId,
            request.HotelName
        );

        var result = await Mediator.Send(command);
        return Ok(result);
    }
}
