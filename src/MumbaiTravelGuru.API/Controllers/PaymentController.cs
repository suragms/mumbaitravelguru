using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.Features.Payments.Commands;

namespace MumbaiTravelGuru.API.Controllers;

public class PaymentController : ApiControllerBase
{
    private readonly IConfiguration _configuration;

    public PaymentController(IConfiguration configuration) => _configuration = configuration;

    [HttpPost("order")]
    [Authorize]
    public async Task<ActionResult<CreatePaymentOrderResult>> CreateOrder([FromBody] CreatePaymentOrderRequest request)
    {
        var command = new CreatePaymentOrderCommand(request.BookingId, request.CouponCode);
        var result = await Mediator.Send(command);
        if (!result.Succeeded)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<ActionResult> Webhook()
    {
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync();

        var signature = Request.Headers["X-Razorpay-Signature"].FirstOrDefault() ?? "";
        var webhookSecret = _configuration["Razorpay:WebhookSecret"] ?? "rzp_test_webhook_secret";

        var command = new ProcessPaymentWebhookCommand(payload, signature, webhookSecret);
        var handled = await Mediator.Send(command);

        if (!handled)
            return BadRequest(new { error = "Webhook processing failed" });

        return Ok(new { status = "ok" });
    }
}

public record CreatePaymentOrderRequest(Guid BookingId, string? CouponCode = null);
