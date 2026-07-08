using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.Auth;
using MumbaiTravelGuru.Application.Features.Auth.Commands;

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
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResult>> Login([FromBody] LoginUserCommand command)
        {
            var result = await Mediator.Send(command);
            if (!result.Succeeded)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
    }
}
