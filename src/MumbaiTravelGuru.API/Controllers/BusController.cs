using MediatR;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.Bus.Queries;
using MumbaiTravelGuru.Application.DTOs.Bus;

namespace MumbaiTravelGuru.API.Controllers;

[ApiController]
[Route("api/v1/bus")]
public class BusController : ControllerBase
{
    private readonly IMediator _mediator;

    public BusController(IMediator mediator) => _mediator = mediator;

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] BusSearchRequestDto request, CancellationToken ct)
    {
        var result = await _mediator.Send(new SearchBusesQuery(request.Origin, request.Destination, request.TravelDate), ct);
        return Ok(result);
    }

    [HttpGet("{tripId}/seats")]
    public async Task<IActionResult> GetSeats(string tripId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetBusSeatsQuery(tripId), ct);
        return result is null ? NotFound() : Ok(result);
    }
}
