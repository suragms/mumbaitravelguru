using System;
using System.Security.Claims;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Common.Interfaces
{
    public interface IJwtTokenService
    {
        string GenerateAccessToken(User user);
        string GenerateRefreshToken();
        ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    }
}
