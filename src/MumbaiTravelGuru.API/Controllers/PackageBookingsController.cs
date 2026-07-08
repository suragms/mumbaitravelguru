using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.Package;
using MumbaiTravelGuru.Application.Features.Packages.Commands;

namespace MumbaiTravelGuru.API.Controllers;

[Authorize]
public class PackageBookingsController : ApiControllerBase
{
    [HttpPost("initiate")]
    public async Task<ActionResult<InitiatePackageBookingResultDto>> Initiate([FromBody] InitiatePackageBookingRequestDto request)
    {
        var command = new InitiatePackageBookingCommand(
            request.PackageId, request.FixedDepartureId, request.Travelers
        );
        var result = await Mediator.Send(command);
        if (!result.Succeeded)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("confirm")]
    public async Task<ActionResult<ConfirmPackageBookingResultDto>> Confirm([FromBody] ConfirmPackageBookingRequestDto request)
    {
        var command = new ConfirmPackageBookingCommand(
            request.BookingId, request.Amount, request.PaymentMethod,
            request.PaymentTransactionId, request.IsFinalPayment
        );
        var result = await Mediator.Send(command);
        if (!result.Succeeded)
            return BadRequest(result);
        return Ok(result);
    }
}
