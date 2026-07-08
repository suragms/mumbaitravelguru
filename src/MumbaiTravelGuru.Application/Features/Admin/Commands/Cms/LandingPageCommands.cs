using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Behaviours;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Features.Admin.Commands.Cms;

[AdminAction("AdminCreateLandingPage", "Admin created a landing page", EntityType = "LandingPage", LogRequest = true)]
public record CreateLandingPageCommand(
    string Title, string Slug, string PageType, string Body,
    string? Excerpt, string? HeroImageUrl,
    string? Origin, string? Destination, string? Category,
    string? MetaTitle, string? MetaDescription,
    string? CanonicalUrl, string? StructuredData) : IRequest<CreateLandingPageResult>;

public class CreateLandingPageResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public Guid? LandingPageId { get; set; }
}

public class CreateLandingPageCommandValidator : AbstractValidator<CreateLandingPageCommand>
{
    public CreateLandingPageCommandValidator()
    {
        RuleFor(v => v.Title).NotEmpty().MaximumLength(300);
        RuleFor(v => v.Slug).NotEmpty().MaximumLength(300)
            .Matches("^[a-z0-9-]+$").WithMessage("Slug must be lowercase alphanumeric with hyphens.");
        RuleFor(v => v.PageType).NotEmpty().MaximumLength(50);
        RuleFor(v => v.Body).NotEmpty();
    }
}

public class CreateLandingPageCommandHandler : IRequestHandler<CreateLandingPageCommand, CreateLandingPageResult>
{
    private readonly IApplicationDbContext _context;

    public CreateLandingPageCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<CreateLandingPageResult> Handle(CreateLandingPageCommand request, CancellationToken cancellationToken)
    {
        var slugExists = await _context.LandingPages.AnyAsync(p => p.Slug == request.Slug && !p.IsDeleted, cancellationToken);
        if (slugExists)
            return new CreateLandingPageResult { Succeeded = false, Error = "A page with this slug already exists." };

        var page = new LandingPage
        {
            Title = request.Title,
            Slug = request.Slug,
            PageType = request.PageType,
            Body = request.Body,
            Excerpt = request.Excerpt,
            HeroImageUrl = request.HeroImageUrl,
            Origin = request.Origin,
            Destination = request.Destination,
            Category = request.Category,
            MetaTitle = request.MetaTitle,
            MetaDescription = request.MetaDescription,
            CanonicalUrl = request.CanonicalUrl,
            StructuredData = request.StructuredData,
        };

        _context.LandingPages.Add(page);
        await _context.SaveChangesAsync(cancellationToken);
        return new CreateLandingPageResult { Succeeded = true, LandingPageId = page.Id };
    }
}

[AdminAction("AdminUpdateLandingPage", "Admin updated a landing page", EntityType = "LandingPage", EntityIdProperty = "PageId", LogRequest = true)]
public record UpdateLandingPageCommand(
    Guid PageId, string? Title, string? Slug, string? PageType, string? Body,
    string? Excerpt, string? HeroImageUrl,
    string? Origin, string? Destination, string? Category,
    bool? IsPublished, DateTime? PublishedAt,
    string? MetaTitle, string? MetaDescription,
    string? CanonicalUrl, string? StructuredData) : IRequest<UpdateLandingPageResult>;

public class UpdateLandingPageResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
}

public class UpdateLandingPageCommandHandler : IRequestHandler<UpdateLandingPageCommand, UpdateLandingPageResult>
{
    private readonly IApplicationDbContext _context;

    public UpdateLandingPageCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<UpdateLandingPageResult> Handle(UpdateLandingPageCommand request, CancellationToken cancellationToken)
    {
        var page = await _context.LandingPages
            .FirstOrDefaultAsync(p => p.Id == request.PageId && !p.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Landing page not found.");

        if (request.Slug != null && request.Slug != page.Slug)
        {
            var slugExists = await _context.LandingPages
                .AnyAsync(p => p.Slug == request.Slug && p.Id != request.PageId && !p.IsDeleted, cancellationToken);
            if (slugExists)
                return new UpdateLandingPageResult { Succeeded = false, Error = "A page with this slug already exists." };
            page.Slug = request.Slug;
        }

        if (request.Title != null) page.Title = request.Title;
        if (request.PageType != null) page.PageType = request.PageType;
        if (request.Body != null) page.Body = request.Body;
        if (request.Excerpt != null) page.Excerpt = request.Excerpt;
        if (request.HeroImageUrl != null) page.HeroImageUrl = request.HeroImageUrl;
        if (request.Origin != null) page.Origin = request.Origin;
        if (request.Destination != null) page.Destination = request.Destination;
        if (request.Category != null) page.Category = request.Category;
        if (request.IsPublished.HasValue)
        {
            page.IsPublished = request.IsPublished.Value;
            if (request.IsPublished.Value && !page.PublishedAt.HasValue)
                page.PublishedAt = DateTime.UtcNow;
        }
        if (request.PublishedAt.HasValue) page.PublishedAt = request.PublishedAt;
        if (request.MetaTitle != null) page.MetaTitle = request.MetaTitle;
        if (request.MetaDescription != null) page.MetaDescription = request.MetaDescription;
        if (request.CanonicalUrl != null) page.CanonicalUrl = request.CanonicalUrl;
        if (request.StructuredData != null) page.StructuredData = request.StructuredData;

        await _context.SaveChangesAsync(cancellationToken);
        return new UpdateLandingPageResult { Succeeded = true };
    }
}
