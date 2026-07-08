using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Behaviours;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Features.Admin.Commands.Cms;

[AdminAction("AdminCreateBlogPost", "Admin created a blog post", EntityType = "BlogPost", LogRequest = true)]
public record CreateBlogPostCommand(
    string Title, string Slug, string Body, string? Excerpt,
    string? HeroImageUrl, string? AuthorName, string? Category, string? Tags,
    string? MetaTitle, string? MetaDescription,
    string? CanonicalUrl, string? StructuredData) : IRequest<CreateBlogPostResult>;

public class CreateBlogPostResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public Guid? BlogPostId { get; set; }
}

public class CreateBlogPostCommandValidator : AbstractValidator<CreateBlogPostCommand>
{
    public CreateBlogPostCommandValidator()
    {
        RuleFor(v => v.Title).NotEmpty().MaximumLength(300);
        RuleFor(v => v.Slug).NotEmpty().MaximumLength(300)
            .Matches("^[a-z0-9-]+$").WithMessage("Slug must be lowercase alphanumeric with hyphens.");
        RuleFor(v => v.Body).NotEmpty();
    }
}

public class CreateBlogPostCommandHandler : IRequestHandler<CreateBlogPostCommand, CreateBlogPostResult>
{
    private readonly IApplicationDbContext _context;

    public CreateBlogPostCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<CreateBlogPostResult> Handle(CreateBlogPostCommand request, CancellationToken cancellationToken)
    {
        var slugExists = await _context.BlogPosts.AnyAsync(p => p.Slug == request.Slug && !p.IsDeleted, cancellationToken);
        if (slugExists)
            return new CreateBlogPostResult { Succeeded = false, Error = "A post with this slug already exists." };

        var post = new BlogPost
        {
            Title = request.Title,
            Slug = request.Slug,
            Body = request.Body,
            Excerpt = request.Excerpt,
            HeroImageUrl = request.HeroImageUrl,
            AuthorName = request.AuthorName,
            Category = request.Category,
            Tags = request.Tags,
            MetaTitle = request.MetaTitle,
            MetaDescription = request.MetaDescription,
            CanonicalUrl = request.CanonicalUrl,
            StructuredData = request.StructuredData,
        };

        _context.BlogPosts.Add(post);
        await _context.SaveChangesAsync(cancellationToken);
        return new CreateBlogPostResult { Succeeded = true, BlogPostId = post.Id };
    }
}

[AdminAction("AdminUpdateBlogPost", "Admin updated a blog post", EntityType = "BlogPost", EntityIdProperty = "PostId", LogRequest = true)]
public record UpdateBlogPostCommand(
    Guid PostId, string? Title, string? Slug, string? Body, string? Excerpt,
    string? HeroImageUrl, string? AuthorName, string? Category, string? Tags,
    bool? IsPublished, DateTime? PublishedAt,
    string? MetaTitle, string? MetaDescription,
    string? CanonicalUrl, string? StructuredData) : IRequest<UpdateBlogPostResult>;

public class UpdateBlogPostResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
}

public class UpdateBlogPostCommandHandler : IRequestHandler<UpdateBlogPostCommand, UpdateBlogPostResult>
{
    private readonly IApplicationDbContext _context;

    public UpdateBlogPostCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<UpdateBlogPostResult> Handle(UpdateBlogPostCommand request, CancellationToken cancellationToken)
    {
        var post = await _context.BlogPosts
            .FirstOrDefaultAsync(p => p.Id == request.PostId && !p.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Blog post not found.");

        if (request.Slug != null && request.Slug != post.Slug)
        {
            var slugExists = await _context.BlogPosts
                .AnyAsync(p => p.Slug == request.Slug && p.Id != request.PostId && !p.IsDeleted, cancellationToken);
            if (slugExists)
                return new UpdateBlogPostResult { Succeeded = false, Error = "A post with this slug already exists." };
            post.Slug = request.Slug;
        }

        if (request.Title != null) post.Title = request.Title;
        if (request.Body != null) post.Body = request.Body;
        if (request.Excerpt != null) post.Excerpt = request.Excerpt;
        if (request.HeroImageUrl != null) post.HeroImageUrl = request.HeroImageUrl;
        if (request.AuthorName != null) post.AuthorName = request.AuthorName;
        if (request.Category != null) post.Category = request.Category;
        if (request.Tags != null) post.Tags = request.Tags;
        if (request.IsPublished.HasValue)
        {
            post.IsPublished = request.IsPublished.Value;
            if (request.IsPublished.Value && !post.PublishedAt.HasValue)
                post.PublishedAt = DateTime.UtcNow;
        }
        if (request.PublishedAt.HasValue) post.PublishedAt = request.PublishedAt;
        if (request.MetaTitle != null) post.MetaTitle = request.MetaTitle;
        if (request.MetaDescription != null) post.MetaDescription = request.MetaDescription;
        if (request.CanonicalUrl != null) post.CanonicalUrl = request.CanonicalUrl;
        if (request.StructuredData != null) post.StructuredData = request.StructuredData;

        await _context.SaveChangesAsync(cancellationToken);
        return new UpdateBlogPostResult { Succeeded = true };
    }
}
