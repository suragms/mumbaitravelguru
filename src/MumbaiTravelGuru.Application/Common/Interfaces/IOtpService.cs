namespace MumbaiTravelGuru.Application.Common.Interfaces;

public interface IOtpService
{
    string GenerateOtp(string identifier);
    bool ValidateOtp(string identifier, string otp);
}
