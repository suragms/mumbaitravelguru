namespace MumbaiTravelGuru.Application.Common.Interfaces;

public class CreateOrderRequest
{
    public Guid BookingId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? Receipt { get; set; }
    public string? Notes { get; set; }
}

public class CreateOrderResponse
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public string? GatewayOrderId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? GatewayKeyId { get; set; }
    public string? PrefillEmail { get; set; }
    public string? PrefillPhone { get; set; }
}

public class RefundRequest
{
    public string GatewayTransactionId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
}

public class RefundResponse
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public string? GatewayRefundId { get; set; }
}

public class WebhookEvent
{
    public string EventType { get; set; } = string.Empty;
    public string GatewayOrderId { get; set; } = string.Empty;
    public string GatewayTransactionId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string Status { get; set; } = string.Empty;
    public string? FailureReason { get; set; }
}

public interface IPaymentGateway
{
    Task<CreateOrderResponse> CreateOrderAsync(CreateOrderRequest request, CancellationToken cancellationToken = default);
    Task<RefundResponse> ProcessRefundAsync(RefundRequest request, CancellationToken cancellationToken = default);
    bool VerifyWebhookSignature(string payload, string signature, string secret);
    WebhookEvent? ParseWebhookEvent(string payload);
}
