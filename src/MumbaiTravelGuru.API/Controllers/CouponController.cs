using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.Coupon;
using MumbaiTravelGuru.Application.Features.Coupons.Queries;

namespace MumbaiTravelGuru.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/coupons")]
public class CouponController : ControllerBase
{
    private readonly IMediator _mediator;

    public CouponController(IMediator mediator) => _mediator = mediator;

    [HttpPost("validate")]
    public async Task<ActionResult<ValidateCouponResultDto>> Validate([FromBody] ValidateCouponRequestDto request, CancellationToken ct)
    {
        var result = await _mediator.Send(new ValidateCouponQuery(request.Code, request.BookingId), ct);
        return Ok(result);
    }
}
