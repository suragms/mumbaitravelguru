using MediatR;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.Features.Public.Queries;

namespace MumbaiTravelGuru.API.Controllers;

[ApiController]
[Route("api/v1/cms")]
public class PublicCmsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PublicCmsController(IMediator mediator) => _mediator = mediator;

    [HttpGet("blog")]
    public async Task<ActionResult> ListBlogPosts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return Ok(await _mediator.Send(new GetPublishedBlogPostsQuery(page, pageSize)));
    }

    [HttpGet("blog/{slug}")]
    public async Task<ActionResult> GetBlogPost(string slug)
    {
        var post = await _mediator.Send(new GetPublishedBlogPostBySlugQuery(slug));
        if (post is null) return NotFound();
        return Ok(post);
    }

    [HttpGet("landing-pages/{slug}")]
    public async Task<ActionResult> GetLandingPage(string slug)
    {
        var page = await _mediator.Send(new GetPublishedLandingPageBySlugQuery(slug));
        if (page is null) return NotFound();
        return Ok(page);
    }
}
