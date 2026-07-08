using FluentValidation;
using MediatR;
using MumbaiTravelGuru.Application.Common.Interfaces;

namespace MumbaiTravelGuru.Application.Features.Auth.Commands;

public record SendOtpCommand(string PhoneNumber) : IRequest<SendOtpResult>;

public class SendOtpCommandValidator : AbstractValidator<SendOtpCommand>
{
    public SendOtpCommandValidator()
    {
        RuleFor(v => v.PhoneNumber).NotEmpty().Matches(@"^\+?[1-9]\d{1,14}$");
    }
}

public class SendOtpCommandHandler : IRequestHandler<SendOtpCommand, SendOtpResult>
{
    private readonly IOtpService _otpService;
    private readonly ISmsService _smsService;

    public SendOtpCommandHandler(IOtpService otpService, ISmsService smsService)
    {
        _otpService = otpService;
        _smsService = smsService;
    }

    public async Task<SendOtpResult> Handle(SendOtpCommand request, CancellationToken cancellationToken)
    {
        var code = _otpService.GenerateOtp(request.PhoneNumber);
        await _smsService.SendSmsAsync(request.PhoneNumber, $"Your MumbaiTravelGuru OTP is: {code}", cancellationToken);
        return new SendOtpResult { Succeeded = true, Message = "OTP sent successfully." };
    }
}

public class SendOtpResult
{
    public bool Succeeded { get; set; }
    public string Message { get; set; } = string.Empty;
}
