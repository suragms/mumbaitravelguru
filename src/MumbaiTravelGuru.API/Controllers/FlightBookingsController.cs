using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.Flight;
using MumbaiTravelGuru.Application.Features.Flights.Commands;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.API.Controllers;

[Authorize]
public class FlightBookingsController : ApiControllerBase
{
    [HttpPost("initiate")]
    public async Task<ActionResult<InitiateBookingResultDto>> Initiate([FromBody] InitiateBookingRequestDto request)
    {
        var command = new InitiateFlightBookingCommand(
            request.OfferId,
            request.Travelers
        );

        var result = await Mediator.Send(command);
        if (!result.Succeeded)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("confirm")]
    public async Task<ActionResult<ConfirmBookingResultDto>> Confirm([FromBody] ConfirmBookingRequestDto request)
    {
        var command = new ConfirmFlightBookingCommand(
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
