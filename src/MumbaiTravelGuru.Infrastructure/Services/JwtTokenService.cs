using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateAccessToken(User user, IList<string> roles)
    {
        var secretKey = _configuration["JwtSettings:Secret"] ?? "MumbaiTravelGuruSuperSecretKeyKey123!!!";
        var issuer = _configuration["JwtSettings:Issuer"] ?? "MumbaiTravelGuru";
        var audience = _configuration["JwtSettings:Audience"] ?? "MumbaiTravelGuruUsers";
        var expiryMinutes = double.Parse(_configuration["JwtSettings:ExpiryMinutes"] ?? "60");

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(secretKey);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("firstName", user.FirstName),
            new("lastName", user.LastName),
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public int GetRefreshTokenExpiryMinutes()
    {
        return int.Parse(_configuration["JwtSettings:RefreshTokenExpiryMinutes"] ?? "43200");
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var secretKey = _configuration["JwtSettings:Secret"] ?? "MumbaiTravelGuruSuperSecretKeyKey123!!!";

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateLifetime = false
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);

        if (securityToken is not JwtSecurityToken jwtSecurityToken ||
            !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
        {
            throw new SecurityTokenException("Invalid token");
        }

        return principal;
    }
}
