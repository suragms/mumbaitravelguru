using Microsoft.Extensions.Logging;
using MumbaiTravelGuru.Application.Common.Interfaces;

namespace MumbaiTravelGuru.Infrastructure.Services;

public class SmsService : ISmsService
{
    private readonly ILogger<SmsService> _logger;

    public SmsService(ILogger<SmsService> logger)
    {
        _logger = logger;
    }

    public Task SendSmsAsync(string phoneNumber, string message, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("SMS to {PhoneNumber}: {Message}", phoneNumber, message);
        return Task.CompletedTask;
    }
}
