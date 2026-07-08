using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MumbaiTravelGuru.Application.DTOs.Cms;
using MumbaiTravelGuru.Application.Features.Admin.Commands.Cms;
using MumbaiTravelGuru.Application.Features.Admin.Queries;

namespace MumbaiTravelGuru.API.Controllers;

[Authorize(Roles = "Admin,SuperAdmin,ContentManager")]
[ApiController]
[Route("api/v1/admin/cms")]
public class AdminCmsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminCmsController(IMediator mediator) => _mediator = mediator;

    [HttpGet("blog")]
    public async Task<ActionResult<BlogPostListResult>> ListBlogPosts(
        [FromQuery] string? search, [FromQuery] bool? isPublished,
        [FromQuery] string? category, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return Ok(await _mediator.Send(new ListBlogPostsQuery(search, isPublished, category, page, pageSize)));
    }

    [HttpGet("blog/{id:guid}")]
    public async Task<ActionResult<BlogPostDto>> GetBlogPost(Guid id)
    {
        var post = await _mediator.Send(new GetBlogPostQuery(id));
        if (post is null) return NotFound();
        return Ok(post);
    }

    [HttpPost("blog")]
    public async Task<ActionResult<CreateBlogPostResult>> CreateBlogPost([FromBody] CreateBlogPostRequestDto request)
    {
        var result = await _mediator.Send(new CreateBlogPostCommand(
            request.Title, request.Slug, request.Body, request.Excerpt,
            request.HeroImageUrl, request.AuthorName, request.Category, request.Tags,
            request.MetaTitle, request.MetaDescription,
            request.CanonicalUrl, request.StructuredData));
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("blog/{id:guid}")]
    public async Task<ActionResult<UpdateBlogPostResult>> UpdateBlogPost(Guid id, [FromBody] UpdateBlogPostRequestDto request)
    {
        var result = await _mediator.Send(new UpdateBlogPostCommand(
            id, request.Title, request.Slug, request.Body, request.Excerpt,
            request.HeroImageUrl, request.AuthorName, request.Category, request.Tags,
            request.IsPublished, request.PublishedAt,
            request.MetaTitle, request.MetaDescription,
            request.CanonicalUrl, request.StructuredData));
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("landing-pages")]
    public async Task<ActionResult<LandingPageListResult>> ListLandingPages(
        [FromQuery] string? search, [FromQuery] string? pageType,
        [FromQuery] bool? isPublished, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        return Ok(await _mediator.Send(new ListLandingPagesQuery(search, pageType, isPublished, page, pageSize)));
    }

    [HttpGet("landing-pages/{id:guid}")]
    public async Task<ActionResult<LandingPageDto>> GetLandingPage(Guid id)
    {
        var page = await _mediator.Send(new GetLandingPageQuery(id));
        if (page is null) return NotFound();
        return Ok(page);
    }

    [HttpPost("landing-pages")]
    public async Task<ActionResult<CreateLandingPageResult>> CreateLandingPage([FromBody] CreateLandingPageRequestDto request)
    {
        var result = await _mediator.Send(new CreateLandingPageCommand(
            request.Title, request.Slug, request.PageType, request.Body,
            request.Excerpt, request.HeroImageUrl,
            request.Origin, request.Destination, request.Category,
            request.MetaTitle, request.MetaDescription,
            request.CanonicalUrl, request.StructuredData));
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("landing-pages/{id:guid}")]
    public async Task<ActionResult<UpdateLandingPageResult>> UpdateLandingPage(Guid id, [FromBody] UpdateLandingPageRequestDto request)
    {
        var result = await _mediator.Send(new UpdateLandingPageCommand(
            id, request.Title, request.Slug, request.PageType, request.Body,
            request.Excerpt, request.HeroImageUrl,
            request.Origin, request.Destination, request.Category,
            request.IsPublished, request.PublishedAt,
            request.MetaTitle, request.MetaDescription,
            request.CanonicalUrl, request.StructuredData));
        if (!result.Succeeded) return BadRequest(result);
        return Ok(result);
    }
}
