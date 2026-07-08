using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Cms;

namespace MumbaiTravelGuru.Application.Features.Public.Queries;

public record GetPublishedBlogPostsQuery(int Page = 1, int PageSize = 20) : IRequest<PublishedBlogPostListResult>;

public record PublishedBlogPostListResult(List<BlogPostListItemDto> Items, int TotalCount, int Page, int PageSize, int TotalPages);

public class GetPublishedBlogPostsQueryHandler : IRequestHandler<GetPublishedBlogPostsQuery, PublishedBlogPostListResult>
{
    private readonly IApplicationDbContext _context;

    public GetPublishedBlogPostsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<PublishedBlogPostListResult> Handle(GetPublishedBlogPostsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.BlogPosts
            .Where(p => p.IsPublished && !p.IsDeleted);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(p => p.PublishedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new BlogPostListItemDto(
                p.Id, p.Title, p.Slug, p.Excerpt,
                p.HeroImageUrl, p.AuthorName, p.Category,
                p.IsPublished, p.PublishedAt, p.CreatedAt))
            .ToListAsync(cancellationToken);

        return new PublishedBlogPostListResult(items, totalCount, request.Page, request.PageSize,
            (int)Math.Ceiling((double)totalCount / request.PageSize));
    }
}

public record GetPublishedBlogPostBySlugQuery(string Slug) : IRequest<BlogPostDto?>;

public class GetPublishedBlogPostBySlugQueryHandler : IRequestHandler<GetPublishedBlogPostBySlugQuery, BlogPostDto?>
{
    private readonly IApplicationDbContext _context;

    public GetPublishedBlogPostBySlugQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<BlogPostDto?> Handle(GetPublishedBlogPostBySlugQuery request, CancellationToken cancellationToken)
    {
        var p = await _context.BlogPosts
            .FirstOrDefaultAsync(p => p.Slug == request.Slug && p.IsPublished && !p.IsDeleted, cancellationToken);
        if (p is null) return null;

        return new BlogPostDto(
            p.Id, p.Title, p.Slug, p.Body, p.Excerpt,
            p.HeroImageUrl, p.AuthorName, p.Category, p.Tags,
            p.IsPublished, p.PublishedAt,
            p.MetaTitle, p.MetaDescription, p.CanonicalUrl, p.StructuredData,
            p.CreatedAt, p.UpdatedAt);
    }
}

public record GetPublishedLandingPageBySlugQuery(string Slug) : IRequest<LandingPageDto?>;

public class GetPublishedLandingPageBySlugQueryHandler : IRequestHandler<GetPublishedLandingPageBySlugQuery, LandingPageDto?>
{
    private readonly IApplicationDbContext _context;

    public GetPublishedLandingPageBySlugQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<LandingPageDto?> Handle(GetPublishedLandingPageBySlugQuery request, CancellationToken cancellationToken)
    {
        var p = await _context.LandingPages
            .FirstOrDefaultAsync(p => p.Slug == request.Slug && p.IsPublished && !p.IsDeleted, cancellationToken);
        if (p is null) return null;

        return new LandingPageDto(
            p.Id, p.Title, p.Slug, p.PageType, p.Body,
            p.Excerpt, p.HeroImageUrl,
            p.Origin, p.Destination, p.Category,
            p.IsPublished, p.PublishedAt,
            p.MetaTitle, p.MetaDescription, p.CanonicalUrl, p.StructuredData,
            p.CreatedAt, p.UpdatedAt);
    }
}
