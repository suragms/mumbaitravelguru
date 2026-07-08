using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.Features.Payments.Commands;

namespace MumbaiTravelGuru.API.Controllers;

[Authorize]
public class BookingCancellationController : ApiControllerBase
{
    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<CancelBookingResult>> Cancel(Guid id, [FromBody] CancelBookingRequestDto request)
    {
        var command = new CancelBookingCommand(id, request.Reason);
        var result = await Mediator.Send(command);
        if (!result.Succeeded)
            return BadRequest(result);
        return Ok(result);
    }
}

public record CancelBookingRequestDto(string? Reason);
