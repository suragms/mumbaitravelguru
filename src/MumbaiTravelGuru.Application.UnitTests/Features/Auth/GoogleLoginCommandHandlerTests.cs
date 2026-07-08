using System;
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

public class GoogleLoginCommandHandlerTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IDateTime _dateTime;

    public GoogleLoginCommandHandlerTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _jwtTokenService = Substitute.For<IJwtTokenService>();
        _dateTime = Substitute.For<IDateTime>();
        _dateTime.UtcNow.Returns(DateTime.UtcNow);
        _jwtTokenService.GenerateAccessToken(Arg.Any<User>(), Arg.Any<IList<string>>()).Returns("test-token");
        _jwtTokenService.GenerateRefreshToken().Returns("test-refresh");
        _jwtTokenService.GetRefreshTokenExpiryMinutes().Returns(43200);
    }

    [Fact]
    public async Task Handle_WithNewGoogleUser_ShouldCreateUserAndReturnToken()
    {
        using (var context = new ApplicationDbContext(_options))
        {
            context.Roles.Add(new Role { Name = "Customer" });
            await context.SaveChangesAsync();
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new GoogleLoginCommandHandler(context, _jwtTokenService, _dateTime);
            var result = await handler.Handle(
                new GoogleLoginCommand("google123", "test@gmail.com", "Test", "User"),
                CancellationToken.None);

            Assert.True(result.Succeeded);
            Assert.Equal("test-token", result.Token);
        }
    }

    [Fact]
    public async Task Handle_WithExistingGoogleUser_ShouldLogin()
    {
        using (var context = new ApplicationDbContext(_options))
        {
            var role = new Role { Name = "Customer" };
            context.Roles.Add(role);
            var user = new User
            {
                Email = "existing@gmail.com",
                GoogleId = "google123",
                GoogleEmail = "existing@gmail.com",
            };
            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new GoogleLoginCommandHandler(context, _jwtTokenService, _dateTime);
            var result = await handler.Handle(
                new GoogleLoginCommand("google123", "existing@gmail.com", "Existing", "User"),
                CancellationToken.None);

            Assert.True(result.Succeeded);
        }
    }

    [Fact]
    public async Task Handle_WithExistingEmailButNoGoogleId_ShouldLinkAccount()
    {
        using (var context = new ApplicationDbContext(_options))
        {
            var role = new Role { Name = "Customer" };
            context.Roles.Add(role);
            var user = new User
            {
                Email = "existing@gmail.com",
                FirstName = "Existing",
                LastName = "User",
            };
            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new GoogleLoginCommandHandler(context, _jwtTokenService, _dateTime);
            var result = await handler.Handle(
                new GoogleLoginCommand("google456", "existing@gmail.com", "Existing", "User"),
                CancellationToken.None);

            Assert.True(result.Succeeded);
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var updated = await context.Users.FirstOrDefaultAsync(u => u.Email == "existing@gmail.com");
            Assert.NotNull(updated);
            Assert.Equal("google456", updated.GoogleId);
        }
    }
}
