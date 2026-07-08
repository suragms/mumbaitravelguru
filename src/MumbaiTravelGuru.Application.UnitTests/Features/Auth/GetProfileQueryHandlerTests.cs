using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.Features.Profile.Queries;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Infrastructure.Persistence;
using NSubstitute;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Features.Auth;

public class GetProfileQueryHandlerTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly ICurrentUserService _currentUser;
    private readonly Guid _userId;

    public GetProfileQueryHandlerTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _userId = Guid.NewGuid();
        _currentUser = Substitute.For<ICurrentUserService>();
        _currentUser.UserId.Returns(_userId);
    }

    [Fact]
    public async Task Handle_WithAuthenticatedUser_ShouldReturnProfile()
    {
        using (var context = new ApplicationDbContext(_options))
        {
            var role = new Role { Name = "Customer" };
            context.Roles.Add(role);
            var user = new User
            {
                Id = _userId,
                Email = "test@example.com",
                FirstName = "Test",
                LastName = "User",
                PhoneNumber = "+919876543210",
            };
            user.UserRoles.Add(new UserRole { UserId = _userId, RoleId = role.Id });
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new GetProfileQueryHandler(context, _currentUser);
            var result = await handler.Handle(new GetProfileQuery(), CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal(_userId, result.Id);
            Assert.Equal("test@example.com", result.Email);
            Assert.Equal("Test", result.FirstName);
            Assert.Equal("User", result.LastName);
        }
    }

    [Fact]
    public async Task Handle_WithoutAuthentication_ShouldThrow()
    {
        _currentUser.UserId.Returns((Guid?)null);

        using var context = new ApplicationDbContext(_options);
        var handler = new GetProfileQueryHandler(context, _currentUser);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new GetProfileQuery(), CancellationToken.None));
    }
}
