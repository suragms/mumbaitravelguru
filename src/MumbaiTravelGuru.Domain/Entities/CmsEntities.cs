using MumbaiTravelGuru.Domain.Common;

namespace MumbaiTravelGuru.Domain.Entities;

public class BlogPost : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? HeroImageUrl { get; set; }
    public string? AuthorName { get; set; }
    public string? Category { get; set; }
    public string? Tags { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? CanonicalUrl { get; set; }
    public string? StructuredData { get; set; }
}

public class LandingPage : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string PageType { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? HeroImageUrl { get; set; }
    public string? Origin { get; set; }
    public string? Destination { get; set; }
    public string? Category { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? CanonicalUrl { get; set; }
    public string? StructuredData { get; set; }
}
