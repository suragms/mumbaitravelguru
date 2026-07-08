using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.Features.SavedTravelers.Commands;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Infrastructure.Persistence;
using NSubstitute;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Features.Auth;

public class CreateSavedTravelerCommandHandlerTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly ICurrentUserService _currentUser;
    private readonly Guid _userId;

    public CreateSavedTravelerCommandHandlerTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _userId = Guid.NewGuid();
        _currentUser = Substitute.For<ICurrentUserService>();
        _currentUser.UserId.Returns(_userId);
    }

    [Fact]
    public async Task Handle_WithValidRequest_ShouldCreateTraveler()
    {
        using (var context = new ApplicationDbContext(_options))
        {
            context.Users.Add(new User { Id = _userId, Email = "test@example.com" });
            await context.SaveChangesAsync();
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new CreateSavedTravelerCommandHandler(context, _currentUser);
            var result = await handler.Handle(
                new CreateSavedTravelerCommand("John", "Doe", "+919876543210", null, null, null, null, "IN", true),
                CancellationToken.None);

            Assert.NotNull(result);
            Assert.Equal("John", result.FirstName);
            Assert.Equal("Doe", result.LastName);
            Assert.Equal("+919876543210", result.PhoneNumber);
            Assert.True(result.IsPrimary);
        }
    }

    [Fact]
    public async Task Handle_WithoutAuthentication_ShouldThrow()
    {
        _currentUser.UserId.Returns((Guid?)null);

        using var context = new ApplicationDbContext(_options);
        var handler = new CreateSavedTravelerCommandHandler(context, _currentUser);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            handler.Handle(new CreateSavedTravelerCommand("John", "Doe", null, null, null, null, null, null, false), CancellationToken.None));
    }
}
