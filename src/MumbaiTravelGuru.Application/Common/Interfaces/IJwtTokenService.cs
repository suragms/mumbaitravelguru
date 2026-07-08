using System.Security.Claims;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(User user, IList<string> roles);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    int GetRefreshTokenExpiryMinutes();
}
