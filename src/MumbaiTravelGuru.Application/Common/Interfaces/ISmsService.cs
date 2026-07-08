namespace MumbaiTravelGuru.Application.Common.Interfaces;

public interface ISmsService
{
    Task SendSmsAsync(string phoneNumber, string message, CancellationToken cancellationToken = default);
}
