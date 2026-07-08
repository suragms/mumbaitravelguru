using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.Vendor;
using MumbaiTravelGuru.Application.Features.Vendor.Commands;
using MumbaiTravelGuru.Application.Features.Vendor.Queries;

namespace MumbaiTravelGuru.API.Controllers;

[Authorize(Roles = "Vendor")]
[ApiController]
[Route("api/v1/vendor")]
public class VendorController : ControllerBase
{
    private readonly IMediator _mediator;

    public VendorController(IMediator mediator) => _mediator = mediator;

    [HttpGet("profile")]
    public async Task<ActionResult<VendorProfileDto>> GetProfile()
    {
        var profile = await _mediator.Send(new GetVendorProfileQuery());
        if (profile is null)
            return NotFound(new { error = "Vendor account not found. Please complete onboarding." });
        return Ok(profile);
    }

    [HttpPut("profile")]
    public async Task<ActionResult<UpdateVendorProfileResult>> UpdateProfile([FromBody] UpdateVendorProfileRequestDto request)
    {
        var result = await _mediator.Send(new UpdateVendorProfileCommand(
            request.BusinessName, request.ContactEmail, request.ContactPhone,
            request.Address, request.GSTIN));
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<VendorDashboardDto>> GetDashboard()
    {
        return Ok(await _mediator.Send(new GetVendorDashboardQuery()));
    }

    [HttpGet("listings")]
    public async Task<ActionResult<List<VendorListingDto>>> GetListings()
    {
        return Ok(await _mediator.Send(new GetVendorListingsQuery()));
    }

    [HttpPut("listings/{id:guid}")]
    public async Task<ActionResult<UpdateVendorListingResult>> UpdateListing(Guid id, [FromBody] UpdateVendorListingRequestDto request)
    {
        var result = await _mediator.Send(new UpdateVendorListingCommand(
            id, request.Title, request.Description, request.DefaultPrice, request.IsActive));
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("listings/{id:guid}/availability")]
    public async Task<ActionResult<List<VendorAvailabilityEntryDto>>> GetAvailability(Guid id)
    {
        return Ok(await _mediator.Send(new GetVendorListingAvailabilityQuery(id)));
    }

    [HttpPut("listings/{id:guid}/availability")]
    public async Task<ActionResult<UpdateAvailabilityResult>> UpdateAvailability(Guid id, [FromBody] List<UpdateAvailabilityRequestDto> entries)
    {
        var result = await _mediator.Send(new UpdateAvailabilityCommand(id, entries));
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("bookings")]
    public async Task<ActionResult<VendorBookingListResult>> GetBookings(
        [FromQuery] string? status, [FromQuery] string? search,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return Ok(await _mediator.Send(new GetVendorBookingsQuery(status, search, page, pageSize)));
    }

    [HttpGet("bookings/{id:guid}")]
    public async Task<ActionResult<VendorBookingDto>> GetBookingDetail(Guid id)
    {
        var booking = await _mediator.Send(new GetVendorBookingDetailQuery(id));
        if (booking is null) return NotFound();
        return Ok(booking);
    }

    [HttpGet("commission-statement")]
    public async Task<ActionResult<VendorCommissionStatementDto>> GetCommissionStatement(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        return Ok(await _mediator.Send(new GetVendorCommissionStatementQuery(from, to)));
    }

    [HttpGet("payouts")]
    public async Task<ActionResult<VendorPayoutListResult>> GetPayouts(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return Ok(await _mediator.Send(new GetVendorPayoutsQuery(page, pageSize)));
    }

    [HttpGet("payouts/{id:guid}")]
    public async Task<ActionResult<VendorPayoutDetailDto>> GetPayoutDetail(Guid id)
    {
        var payout = await _mediator.Send(new GetVendorPayoutDetailQuery(id));
        if (payout is null) return NotFound();
        return Ok(payout);
    }
}
