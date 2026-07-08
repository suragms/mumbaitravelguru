using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.Bus.Commands;
using MumbaiTravelGuru.Application.DTOs.Bus;
using System.Security.Claims;

namespace MumbaiTravelGuru.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/bus/bookings")]
public class BusBookingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public BusBookingsController(IMediator mediator) => _mediator = mediator;

    [HttpPost("initiate")]
    public async Task<IActionResult> Initiate([FromBody] InitiateBusBookingRequestDto request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _mediator.Send(new InitiateBusBookingCommand(
            userId, request.TripId, request.SeatIds, request.BoardingPointId, request.DroppingPointId), ct);
        return Ok(result);
    }

    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm([FromBody] ConfirmBusBookingRequestDto request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _mediator.Send(new ConfirmBusBookingCommand(
            request.BookingId, request.FareLockId, request.Travelers ?? new()), ct);
        return Ok(result);
    }
}
