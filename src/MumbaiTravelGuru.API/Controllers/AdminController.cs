using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.Features.Admin;
using MumbaiTravelGuru.Application.Features.Admin.Commands;
using MumbaiTravelGuru.Application.Features.Admin.Queries;

namespace MumbaiTravelGuru.API.Controllers;

[Authorize(Roles = "Admin,SuperAdmin,Ops,Finance,ContentManager")]
[Route("api/v1/admin")]
public class AdminController : ApiControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<AdminDashboardDto>> Dashboard()
    {
        return Ok(await Mediator.Send(new GetAdminDashboardQuery()));
    }

    [HttpGet("bookings")]
    public async Task<ActionResult<AdminBookingsResult>> GetBookings(
        [FromQuery] string? search, [FromQuery] string? bookingType,
        [FromQuery] string? status, [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return Ok(await Mediator.Send(new GetAdminBookingsQuery(search, bookingType, status, dateFrom, dateTo, page, pageSize)));
    }

    [HttpGet("bookings/{id:guid}")]
    public async Task<ActionResult<AdminBookingDetailDto>> GetBookingDetail(Guid id)
    {
        return Ok(await Mediator.Send(new GetAdminBookingDetailQuery(id)));
    }

    [HttpPost("bookings/{id:guid}/cancel")]
    [Authorize(Roles = "Admin,SuperAdmin,Finance")]
    public async Task<ActionResult<AdminCancelBookingResult>> CancelBooking(Guid id, [FromBody] AdminCancelRequestDto request)
    {
        var result = await Mediator.Send(new AdminCancelBookingCommand(id, request.Reason));
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("bookings/{id:guid}/resend-voucher")]
    [Authorize(Roles = "Admin,SuperAdmin,Ops")]
    public async Task<ActionResult<AdminResendVoucherResult>> ResendVoucher(Guid id)
    {
        var result = await Mediator.Send(new AdminResendVoucherCommand(id));
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("users")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<AdminUsersResult>> GetUsers(
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return Ok(await Mediator.Send(new GetAdminUsersQuery(search, page, pageSize)));
    }

    [HttpPost("users/assign-role")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<AdminAssignRoleResult>> AssignRole([FromBody] AssignRoleRequestDto request)
    {
        var result = await Mediator.Send(new AdminAssignRoleCommand(request.UserId, request.Role));
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("audit-logs")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<AuditLogsResult>> GetAuditLogs(
        [FromQuery] string? action, [FromQuery] string? userEmail,
        [FromQuery] string? entityType, [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        return Ok(await Mediator.Send(new GetAuditLogsQuery(action, userEmail, entityType, dateFrom, dateTo, page, pageSize)));
    }
}

public record AdminCancelRequestDto(string? Reason);
