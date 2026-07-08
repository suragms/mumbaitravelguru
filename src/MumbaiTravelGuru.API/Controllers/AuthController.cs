using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.Auth;
using MumbaiTravelGuru.Application.Features.Auth.Commands;
using MumbaiTravelGuru.Application.Features.Profile.Commands;
using MumbaiTravelGuru.Application.Features.Profile.Queries;

namespace MumbaiTravelGuru.API.Controllers
{
    public class AuthController : ApiControllerBase
    {
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResult>> Register([FromBody] RegisterUserCommand command)
        {
            var result = await Mediator.Send(command);
            if (!result.Succeeded)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResult>> Login([FromBody] LoginUserCommand command)
        {
            var result = await Mediator.Send(command);
            if (!result.Succeeded)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("send-otp")]
        [AllowAnonymous]
        public async Task<ActionResult<SendOtpResult>> SendOtp([FromBody] SendOtpCommand command)
        {
            var result = await Mediator.Send(command);
            if (!result.Succeeded)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("verify-otp")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResult>> VerifyOtp([FromBody] VerifyOtpCommand command)
        {
            var result = await Mediator.Send(command);
            if (!result.Succeeded)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("google-login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResult>> GoogleLogin([FromBody] GoogleLoginCommand command)
        {
            var result = await Mediator.Send(command);
            if (!result.Succeeded)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResult>> Refresh([FromBody] RefreshTokenCommand command)
        {
            var result = await Mediator.Send(command);
            if (!result.Succeeded)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetProfile()
        {
            return Ok(await Mediator.Send(new GetProfileQuery()));
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileCommand command)
        {
            return Ok(await Mediator.Send(command));
        }
    }
}
