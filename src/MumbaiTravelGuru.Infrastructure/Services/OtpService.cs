using System.Collections.Concurrent;
using MumbaiTravelGuru.Application.Common.Interfaces;

namespace MumbaiTravelGuru.Infrastructure.Services;

public class OtpService : IOtpService
{
    private static readonly ConcurrentDictionary<string, OtpEntry> _otpStore = new();

    private static readonly TimeSpan OtpExpiry = TimeSpan.FromMinutes(5);

    public string GenerateOtp(string identifier)
    {
        var code = Random.Shared.Next(100000, 999999).ToString();
        _otpStore[identifier] = new OtpEntry(code, DateTime.UtcNow.Add(OtpExpiry));
        return code;
    }

    public bool ValidateOtp(string identifier, string otp)
    {
        if (!_otpStore.TryGetValue(identifier, out var entry))
            return false;

        if (entry.Expiry < DateTime.UtcNow || entry.Code != otp)
        {
            _otpStore.TryRemove(identifier, out _);
            return false;
        }

        _otpStore.TryRemove(identifier, out _);
        return true;
    }

    private record OtpEntry(string Code, DateTime Expiry);
}
