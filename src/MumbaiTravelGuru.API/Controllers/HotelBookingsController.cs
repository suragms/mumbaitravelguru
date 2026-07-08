using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.Hotel;
using MumbaiTravelGuru.Application.Features.Hotels.Commands;

namespace MumbaiTravelGuru.API.Controllers;

[Authorize]
public class HotelBookingsController : ApiControllerBase
{
    [HttpPost("initiate")]
    public async Task<ActionResult<InitiateHotelBookingResultDto>> Initiate([FromBody] InitiateHotelBookingRequestDto request)
    {
        var command = new InitiateHotelBookingCommand(
            request.OfferId,
            request.RoomId,
            request.RoomQuantity,
            request.Travelers
        );

        var result = await Mediator.Send(command);
        if (!result.Succeeded)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("confirm")]
    public async Task<ActionResult<ConfirmHotelBookingResultDto>> Confirm([FromBody] ConfirmHotelBookingRequestDto request)
    {
        var command = new ConfirmHotelBookingCommand(
            request.LockId,
            request.PaymentMethod,
            request.PaymentTransactionId
        );

        var result = await Mediator.Send(command);
        if (!result.Succeeded)
            return BadRequest(result);
        return Ok(result);
    }
}
