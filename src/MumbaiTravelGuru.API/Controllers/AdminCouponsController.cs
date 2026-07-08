using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.Coupon;
using MumbaiTravelGuru.Application.Features.Admin.Commands.Coupons;
using MumbaiTravelGuru.Application.Features.Admin.Queries;

namespace MumbaiTravelGuru.API.Controllers;

[Authorize(Roles = "Admin,SuperAdmin")]
[Route("api/v1/admin/coupons")]
public class AdminCouponsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminCouponsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<CouponListResult>> List(
        [FromQuery] string? search, [FromQuery] bool? isActive,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return Ok(await _mediator.Send(new ListCouponsQuery(search, isActive, page, pageSize)));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CouponDto?>> Get(Guid id)
    {
        var coupon = await _mediator.Send(new GetCouponQuery(id));
        if (coupon is null) return NotFound();
        return Ok(coupon);
    }

    [HttpPost]
    public async Task<ActionResult<CreateCouponResult>> Create([FromBody] CreateCouponRequestDto request)
    {
        var result = await _mediator.Send(new CreateCouponCommand(
            request.Code, request.Type, request.Value, request.MaxDiscountAmount,
            request.MinBookingValue, request.ApplicableVerticals,
            request.ValidFrom, request.ValidTo,
            request.MaxUsageCount, request.MaxUsagePerUser, request.Description));
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UpdateCouponResult>> Update(Guid id, [FromBody] UpdateCouponRequestDto request)
    {
        var result = await _mediator.Send(new UpdateCouponCommand(
            id, request.Code, request.Type, request.Value, request.MaxDiscountAmount,
            request.MinBookingValue, request.ApplicableVerticals,
            request.ValidFrom, request.ValidTo,
            request.MaxUsageCount, request.MaxUsagePerUser, request.Description));
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id:guid}/deactivate")]
    public async Task<ActionResult<DeactivateCouponResult>> Deactivate(Guid id)
    {
        var result = await _mediator.Send(new DeactivateCouponCommand(id));
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }
}
