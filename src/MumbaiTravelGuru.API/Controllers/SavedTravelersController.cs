using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.SavedTraveler;
using MumbaiTravelGuru.Application.Features.SavedTravelers.Commands;
using MumbaiTravelGuru.Application.Features.SavedTravelers.Queries;

namespace MumbaiTravelGuru.API.Controllers
{
    [Authorize]
    public class SavedTravelersController : ApiControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<List<SavedTravelerDto>>> GetAll()
        {
            return Ok(await Mediator.Send(new GetSavedTravelersQuery()));
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<SavedTravelerDto>> GetById(Guid id)
        {
            return Ok(await Mediator.Send(new GetSavedTravelerByIdQuery(id)));
        }

        [HttpPost]
        public async Task<ActionResult<SavedTravelerDto>> Create([FromBody] CreateSavedTravelerCommand command)
        {
            return Ok(await Mediator.Send(command));
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<SavedTravelerDto>> Update(Guid id, [FromBody] UpdateSavedTravelerCommand command)
        {
            if (id != command.Id)
                return BadRequest("Id mismatch.");
            return Ok(await Mediator.Send(command));
        }

        [HttpDelete("{id:guid}")]
        public async Task<ActionResult<bool>> Delete(Guid id)
        {
            return Ok(await Mediator.Send(new DeleteSavedTravelerCommand(id)));
        }
    }
}
