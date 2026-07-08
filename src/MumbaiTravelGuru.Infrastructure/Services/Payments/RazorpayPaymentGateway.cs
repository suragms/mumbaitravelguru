using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using MumbaiTravelGuru.Application.Common.Interfaces;

namespace MumbaiTravelGuru.Infrastructure.Services.Payments;

public class RazorpaySettings
{
    public string KeyId { get; set; } = string.Empty;
    public string KeySecret { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.razorpay.com/v1";
}

public class RazorpayPaymentGateway : IPaymentGateway
{
    private readonly HttpClient _httpClient;
    private readonly RazorpaySettings _settings;

    public RazorpayPaymentGateway(HttpClient httpClient, RazorpaySettings settings)
    {
        _httpClient = httpClient;
        _settings = settings;

        var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{settings.KeyId}:{settings.KeySecret}"));
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", auth);
    }

    public async Task<CreateOrderResponse> CreateOrderAsync(CreateOrderRequest request, CancellationToken cancellationToken = default)
    {
        var amountPaise = (int)(request.Amount * 100);

        var payload = new
        {
            amount = amountPaise,
            currency = request.Currency,
            receipt = request.Receipt ?? $"booking_{request.BookingId:N}",
            notes = new
            {
                booking_id = request.BookingId.ToString(),
                info = request.Notes ?? "",
            },
        };

        try
        {
            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull });
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{_settings.BaseUrl}/orders", content, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (!response.IsSuccessStatusCode)
            {
                var err = root.TryGetProperty("error", out var errEl) ? errEl.GetProperty("description").GetString() : "Order creation failed";
                return new CreateOrderResponse { Succeeded = false, Error = err };
            }

            return new CreateOrderResponse
            {
                Succeeded = true,
                GatewayOrderId = root.GetProperty("id").GetString(),
                Amount = root.GetProperty("amount").GetDecimal() / 100,
                Currency = root.GetProperty("currency").GetString() ?? "INR",
                GatewayKeyId = _settings.KeyId,
            };
        }
        catch (Exception ex)
        {
            return new CreateOrderResponse { Succeeded = false, Error = ex.Message };
        }
    }

    public async Task<RefundResponse> ProcessRefundAsync(RefundRequest request, CancellationToken cancellationToken = default)
    {
        var amountPaise = (int)(request.Amount * 100);

        var payload = new
        {
            amount = amountPaise,
            speed = "normal",
            notes = new { reason = request.Reason ?? "" },
        };

        try
        {
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(
                $"{_settings.BaseUrl}/payments/{request.GatewayTransactionId}/refund", content, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (!response.IsSuccessStatusCode)
            {
                var err = root.TryGetProperty("error", out var errEl) ? errEl.GetProperty("description").GetString() : "Refund failed";
                return new RefundResponse { Succeeded = false, Error = err };
            }

            return new RefundResponse
            {
                Succeeded = true,
                GatewayRefundId = root.GetProperty("id").GetString(),
            };
        }
        catch (Exception ex)
        {
            return new RefundResponse { Succeeded = false, Error = ex.Message };
        }
    }

    public bool VerifyWebhookSignature(string payload, string signature, string secret)
    {
        if (string.IsNullOrEmpty(payload) || string.IsNullOrEmpty(signature) || string.IsNullOrEmpty(secret))
            return false;

        var expected = GenerateRazorpaySignature(payload, secret);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(signature));
    }

    public WebhookEvent? ParseWebhookEvent(string payload)
    {
        using var doc = JsonDocument.Parse(payload);
        var root = doc.RootElement;

        var eventType = root.GetProperty("event").GetString() ?? "";

        if (!eventType.StartsWith("payment."))
            return null;

        var payment = root.GetProperty("payload").GetProperty("payment").GetProperty("entity");
        var order = root.GetProperty("payload").GetProperty("order").GetProperty("entity");

        var status = payment.GetProperty("status").GetString() ?? "";
        var amount = payment.GetProperty("amount").GetDecimal() / 100;

        return new WebhookEvent
        {
            EventType = eventType,
            GatewayOrderId = order.GetProperty("id").GetString() ?? "",
            GatewayTransactionId = payment.GetProperty("id").GetString() ?? "",
            Amount = amount,
            Currency = payment.GetProperty("currency").GetString() ?? "INR",
            Status = status,
            FailureReason = status == "failed" ? payment.TryGetProperty("error_description", out var err) ? err.GetString() : null : null,
        };
    }

    internal static string GenerateRazorpaySignature(string payload, string secret)
    {
        var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }
}
