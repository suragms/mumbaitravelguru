using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.Flight;
using MumbaiTravelGuru.Application.Features.Flights.Queries;

namespace MumbaiTravelGuru.API.Controllers;

public class FlightsController : ApiControllerBase
{
    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<List<FlightOfferDto>>> Search(
        [FromQuery] string origin,
        [FromQuery] string destinations,
        [FromQuery] string departureDates,
        [FromQuery] int adults = 1,
        [FromQuery] int children = 0,
        [FromQuery] int infants = 0,
        [FromQuery] string cabinClass = "Economy",
        [FromQuery] string tripType = "OneWay",
        [FromQuery] string? currency = null)
    {
        var query = new SearchFlightsQuery(
            origin,
            destinations.Split(',').Select(d => d.Trim()).ToList(),
            departureDates.Split(',').Select(d => d.Trim()).ToList(),
            adults,
            children,
            infants,
            cabinClass,
            tripType,
            currency
        );

        return Ok(await Mediator.Send(query));
    }
}
