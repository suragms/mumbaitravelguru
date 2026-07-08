using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.Features.Auth.Commands;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Infrastructure.Persistence;
using NSubstitute;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Features.Auth;

public class RefreshTokenCommandHandlerTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IDateTime _dateTime;

    public RefreshTokenCommandHandlerTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _jwtTokenService = Substitute.For<IJwtTokenService>();
        _dateTime = Substitute.For<IDateTime>();
        _dateTime.UtcNow.Returns(DateTime.UtcNow);
        _jwtTokenService.GenerateAccessToken(Arg.Any<User>(), Arg.Any<IList<string>>()).Returns("new-token");
        _jwtTokenService.GenerateRefreshToken().Returns("new-refresh");
        _jwtTokenService.GetRefreshTokenExpiryMinutes().Returns(43200);
    }

    [Fact]
    public async Task Handle_WithInvalidToken_ShouldReturnError()
    {
        _jwtTokenService.GetPrincipalFromExpiredToken(Arg.Any<string>()).Returns((ClaimsPrincipal)null!);

        using var context = new ApplicationDbContext(_options);
        var handler = new RefreshTokenCommandHandler(context, _jwtTokenService, _dateTime);

        var result = await handler.Handle(new RefreshTokenCommand("bad-token", "bad-refresh"), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal("Invalid token.", result.Error);
    }

    [Fact]
    public async Task Handle_WithValidTokens_ShouldReturnNewTokens()
    {
        var userId = Guid.NewGuid();
        var claims = new List<Claim> { new("sub", userId.ToString()) };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);

        _jwtTokenService.GetPrincipalFromExpiredToken(Arg.Any<string>()).Returns(principal);

        using (var context = new ApplicationDbContext(_options))
        {
            var role = new Role { Name = "Customer" };
            context.Roles.Add(role);
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                RefreshToken = "existing-refresh",
                RefreshTokenExpiry = DateTime.UtcNow.AddDays(30),
            };
            user.UserRoles.Add(new UserRole { UserId = userId, RoleId = role.Id });
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new RefreshTokenCommandHandler(context, _jwtTokenService, _dateTime);
            var result = await handler.Handle(
                new RefreshTokenCommand("expired-token", "existing-refresh"),
                CancellationToken.None);

            Assert.True(result.Succeeded);
            Assert.Equal("new-token", result.Token);
            Assert.Equal("new-refresh", result.RefreshToken);
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var updated = await context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            Assert.NotNull(updated);
            Assert.Equal("new-refresh", updated.RefreshToken);
        }
    }

    [Fact]
    public async Task Handle_WithExpiredRefreshToken_ShouldReturnError()
    {
        var userId = Guid.NewGuid();
        var claims = new List<Claim> { new("sub", userId.ToString()) };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);

        _jwtTokenService.GetPrincipalFromExpiredToken(Arg.Any<string>()).Returns(principal);

        using (var context = new ApplicationDbContext(_options))
        {
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                RefreshToken = "expired-refresh",
                RefreshTokenExpiry = DateTime.UtcNow.AddDays(-1),
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new RefreshTokenCommandHandler(context, _jwtTokenService, _dateTime);
            var result = await handler.Handle(
                new RefreshTokenCommand("expired-token", "expired-refresh"),
                CancellationToken.None);

            Assert.False(result.Succeeded);
            Assert.Equal("Invalid or expired refresh token.", result.Error);
        }
    }
}
