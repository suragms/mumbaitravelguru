using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.Package;
using MumbaiTravelGuru.Application.Features.Packages.Commands;
using MumbaiTravelGuru.Application.Features.Packages.Queries;

namespace MumbaiTravelGuru.API.Controllers;

public class PackagesController : ApiControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<PackageListItemDto>>> List(
        [FromQuery] string? destination,
        [FromQuery] int? maxDuration,
        [FromQuery] string? theme,
        [FromQuery] decimal? maxPrice)
    {
        return Ok(await Mediator.Send(new ListPackagesQuery(destination, maxDuration, theme, maxPrice)));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<PackageDetailDto>> GetDetail(Guid id)
    {
        return Ok(await Mediator.Send(new GetPackageDetailQuery(id)));
    }

    [HttpPost("{id:guid}/enquire")]
    [Authorize]
    public async Task<ActionResult<PackageEnquiryResultDto>> Enquire(Guid id, [FromBody] PackageEnquiryRequestDto request)
    {
        var command = new PackageEnquiryCommand(
            id, request.Name, request.Email, request.Phone,
            request.Travelers, request.PreferredStartDate, request.PreferredEndDate, request.Message
        );
        var result = await Mediator.Send(command);
        if (!result.Succeeded)
            return BadRequest(result);
        return Ok(result);
    }
}
