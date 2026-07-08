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

public class VerifyOtpCommandHandlerTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly IOtpService _otpService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IDateTime _dateTime;

    public VerifyOtpCommandHandlerTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _otpService = Substitute.For<IOtpService>();
        _jwtTokenService = Substitute.For<IJwtTokenService>();
        _dateTime = Substitute.For<IDateTime>();
        _dateTime.UtcNow.Returns(DateTime.UtcNow);
        _jwtTokenService.GenerateAccessToken(Arg.Any<User>(), Arg.Any<IList<string>>()).Returns("test-token");
        _jwtTokenService.GenerateRefreshToken().Returns("test-refresh");
        _jwtTokenService.GetRefreshTokenExpiryMinutes().Returns(43200);
    }

    [Fact]
    public async Task Handle_WithInvalidOtp_ShouldReturnError()
    {
        _otpService.ValidateOtp("+919876543210", "000000").Returns(false);

        using var context = new ApplicationDbContext(_options);
        var handler = new VerifyOtpCommandHandler(context, _otpService, _jwtTokenService, _dateTime);

        var result = await handler.Handle(new VerifyOtpCommand("+919876543210", "000000"), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal("Invalid or expired OTP.", result.Error);
    }

    [Fact]
    public async Task Handle_WithValidOtpAndNewUser_ShouldCreateUserAndReturnToken()
    {
        _otpService.ValidateOtp("+919876543210", "123456").Returns(true);

        using (var context = new ApplicationDbContext(_options))
        {
            context.Roles.Add(new Role { Name = "Customer" });
            await context.SaveChangesAsync();
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new VerifyOtpCommandHandler(context, _otpService, _jwtTokenService, _dateTime);
            var result = await handler.Handle(new VerifyOtpCommand("+919876543210", "123456"), CancellationToken.None);

            Assert.True(result.Succeeded);
            Assert.Equal("test-token", result.Token);
            Assert.NotNull(result.User);
        }
    }

    [Fact]
    public async Task Handle_WithValidOtpAndExistingUser_ShouldLogin()
    {
        _otpService.ValidateOtp("+919876543210", "123456").Returns(true);

        var userId = Guid.NewGuid();
        using (var context = new ApplicationDbContext(_options))
        {
            var role = new Role { Name = "Customer" };
            context.Roles.Add(role);
            var user = new User
            {
                Id = userId,
                PhoneNumber = "+919876543210",
            };
            user.UserRoles.Add(new UserRole { UserId = userId, RoleId = role.Id });
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new VerifyOtpCommandHandler(context, _otpService, _jwtTokenService, _dateTime);
            var result = await handler.Handle(new VerifyOtpCommand("+919876543210", "123456"), CancellationToken.None);

            Assert.True(result.Succeeded);
            Assert.NotNull(result.User);
        }
    }
}
