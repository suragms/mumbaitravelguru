using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Cms;

namespace MumbaiTravelGuru.Application.Features.Admin.Queries;

public record ListBlogPostsQuery(string? Search, bool? IsPublished, string? Category, int Page = 1, int PageSize = 20)
    : IRequest<BlogPostListResult>;

public record BlogPostListResult(List<BlogPostListItemDto> Items, int TotalCount, int Page, int PageSize);

public class ListBlogPostsQueryHandler : IRequestHandler<ListBlogPostsQuery, BlogPostListResult>
{
    private readonly IApplicationDbContext _context;

    public ListBlogPostsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<BlogPostListResult> Handle(ListBlogPostsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.BlogPosts.Where(p => !p.IsDeleted);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(p => p.Title.Contains(request.Search) || p.Slug.Contains(request.Search));

        if (request.IsPublished.HasValue)
            query = query.Where(p => p.IsPublished == request.IsPublished.Value);

        if (!string.IsNullOrWhiteSpace(request.Category))
            query = query.Where(p => p.Category == request.Category);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new BlogPostListItemDto(
                p.Id, p.Title, p.Slug, p.Excerpt,
                p.HeroImageUrl, p.AuthorName, p.Category,
                p.IsPublished, p.PublishedAt, p.CreatedAt))
            .ToListAsync(cancellationToken);

        return new BlogPostListResult(items, totalCount, request.Page, request.PageSize);
    }
}

public record GetBlogPostQuery(Guid PostId) : IRequest<BlogPostDto?>;

public class GetBlogPostQueryHandler : IRequestHandler<GetBlogPostQuery, BlogPostDto?>
{
    private readonly IApplicationDbContext _context;

    public GetBlogPostQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<BlogPostDto?> Handle(GetBlogPostQuery request, CancellationToken cancellationToken)
    {
        var p = await _context.BlogPosts
            .FirstOrDefaultAsync(p => p.Id == request.PostId && !p.IsDeleted, cancellationToken);
        if (p is null) return null;

        return new BlogPostDto(
            p.Id, p.Title, p.Slug, p.Body, p.Excerpt,
            p.HeroImageUrl, p.AuthorName, p.Category, p.Tags,
            p.IsPublished, p.PublishedAt,
            p.MetaTitle, p.MetaDescription, p.CanonicalUrl, p.StructuredData,
            p.CreatedAt, p.UpdatedAt);
    }
}

public record ListLandingPagesQuery(string? Search, string? PageType, bool? IsPublished, int Page = 1, int PageSize = 20)
    : IRequest<LandingPageListResult>;

public record LandingPageListResult(List<LandingPageListItemDto> Items, int TotalCount, int Page, int PageSize);

public class ListLandingPagesQueryHandler : IRequestHandler<ListLandingPagesQuery, LandingPageListResult>
{
    private readonly IApplicationDbContext _context;

    public ListLandingPagesQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<LandingPageListResult> Handle(ListLandingPagesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.LandingPages.Where(p => !p.IsDeleted);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(p => p.Title.Contains(request.Search) || p.Slug.Contains(request.Search));

        if (!string.IsNullOrWhiteSpace(request.PageType))
            query = query.Where(p => p.PageType == request.PageType);

        if (request.IsPublished.HasValue)
            query = query.Where(p => p.IsPublished == request.IsPublished.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new LandingPageListItemDto(
                p.Id, p.Title, p.Slug, p.PageType,
                p.Excerpt, p.Origin, p.Destination,
                p.IsPublished, p.PublishedAt, p.CreatedAt))
            .ToListAsync(cancellationToken);

        return new LandingPageListResult(items, totalCount, request.Page, request.PageSize);
    }
}

public record GetLandingPageQuery(Guid PageId) : IRequest<LandingPageDto?>;

public class GetLandingPageQueryHandler : IRequestHandler<GetLandingPageQuery, LandingPageDto?>
{
    private readonly IApplicationDbContext _context;

    public GetLandingPageQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<LandingPageDto?> Handle(GetLandingPageQuery request, CancellationToken cancellationToken)
    {
        var p = await _context.LandingPages
            .FirstOrDefaultAsync(p => p.Id == request.PageId && !p.IsDeleted, cancellationToken);
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
