using System.Threading;
using System.Threading.Tasks;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.Features.Auth.Commands;
using NSubstitute;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Features.Auth;

public class SendOtpCommandHandlerTests
{
    private readonly IOtpService _otpService;
    private readonly ISmsService _smsService;
    private readonly SendOtpCommandHandler _handler;

    public SendOtpCommandHandlerTests()
    {
        _otpService = Substitute.For<IOtpService>();
        _smsService = Substitute.For<ISmsService>();
        _handler = new SendOtpCommandHandler(_otpService, _smsService);
    }

    [Fact]
    public async Task Handle_ShouldGenerateOtpAndSendSms()
    {
        _otpService.GenerateOtp("+919876543210").Returns("123456");

        var result = await _handler.Handle(new SendOtpCommand("+919876543210"), CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.Equal("OTP sent successfully.", result.Message);
        _otpService.Received(1).GenerateOtp("+919876543210");
        await _smsService.Received(1).SendSmsAsync("+919876543210", Arg.Any<string>(), Arg.Any<CancellationToken>());
    }
}
