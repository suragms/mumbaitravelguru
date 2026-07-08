namespace MumbaiTravelGuru.Application.DTOs.Cms;

public record BlogPostDto(
    Guid Id, string Title, string Slug, string Body, string? Excerpt,
    string? HeroImageUrl, string? AuthorName, string? Category, string? Tags,
    bool IsPublished, DateTime? PublishedAt,
    string? MetaTitle, string? MetaDescription,
    string? CanonicalUrl, string? StructuredData,
    DateTime CreatedAt, DateTime? UpdatedAt);

public record BlogPostListItemDto(
    Guid Id, string Title, string Slug, string? Excerpt,
    string? HeroImageUrl, string? AuthorName, string? Category,
    bool IsPublished, DateTime? PublishedAt, DateTime CreatedAt);

public record LandingPageDto(
    Guid Id, string Title, string Slug, string PageType, string Body,
    string? Excerpt, string? HeroImageUrl,
    string? Origin, string? Destination, string? Category,
    bool IsPublished, DateTime? PublishedAt,
    string? MetaTitle, string? MetaDescription,
    string? CanonicalUrl, string? StructuredData,
    DateTime CreatedAt, DateTime? UpdatedAt);

public record LandingPageListItemDto(
    Guid Id, string Title, string Slug, string PageType,
    string? Excerpt, string? Origin, string? Destination,
    bool IsPublished, DateTime? PublishedAt, DateTime CreatedAt);

public record CreateBlogPostRequestDto(
    string Title, string Slug, string Body, string? Excerpt,
    string? HeroImageUrl, string? AuthorName, string? Category, string? Tags,
    string? MetaTitle, string? MetaDescription,
    string? CanonicalUrl, string? StructuredData);

public record UpdateBlogPostRequestDto(
    string? Title, string? Slug, string? Body, string? Excerpt,
    string? HeroImageUrl, string? AuthorName, string? Category, string? Tags,
    bool? IsPublished, DateTime? PublishedAt,
    string? MetaTitle, string? MetaDescription,
    string? CanonicalUrl, string? StructuredData);

public record CreateLandingPageRequestDto(
    string Title, string Slug, string PageType, string Body,
    string? Excerpt, string? HeroImageUrl,
    string? Origin, string? Destination, string? Category,
    string? MetaTitle, string? MetaDescription,
    string? CanonicalUrl, string? StructuredData);

public record UpdateLandingPageRequestDto(
    string? Title, string? Slug, string? PageType, string? Body,
    string? Excerpt, string? HeroImageUrl,
    string? Origin, string? Destination, string? Category,
    bool? IsPublished, DateTime? PublishedAt,
    string? MetaTitle, string? MetaDescription,
    string? CanonicalUrl, string? StructuredData);
