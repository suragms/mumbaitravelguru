using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class BlogPostConfiguration : IEntityTypeConfiguration<BlogPost>
{
    public void Configure(EntityTypeBuilder<BlogPost> builder)
    {
        builder.ToTable("BlogPosts");
        builder.HasKey(p => p.Id);

        builder.HasIndex(p => p.Slug).IsUnique();

        builder.Property(p => p.Title).HasMaxLength(300).IsRequired();
        builder.Property(p => p.Slug).HasMaxLength(300).IsRequired();
        builder.Property(p => p.Body).IsRequired();
        builder.Property(p => p.Excerpt).HasMaxLength(500);
        builder.Property(p => p.HeroImageUrl).HasMaxLength(1000);
        builder.Property(p => p.AuthorName).HasMaxLength(200);
        builder.Property(p => p.Category).HasMaxLength(100);
        builder.Property(p => p.Tags).HasMaxLength(1000);
        builder.Property(p => p.MetaTitle).HasMaxLength(200);
        builder.Property(p => p.MetaDescription).HasMaxLength(500);
        builder.Property(p => p.CanonicalUrl).HasMaxLength(1000);
        builder.Property(p => p.StructuredData);
    }
}

public class LandingPageConfiguration : IEntityTypeConfiguration<LandingPage>
{
    public void Configure(EntityTypeBuilder<LandingPage> builder)
    {
        builder.ToTable("LandingPages");
        builder.HasKey(p => p.Id);

        builder.HasIndex(p => p.Slug).IsUnique();

        builder.Property(p => p.Title).HasMaxLength(300).IsRequired();
        builder.Property(p => p.Slug).HasMaxLength(300).IsRequired();
        builder.Property(p => p.PageType).HasMaxLength(50).IsRequired();
        builder.Property(p => p.Body).IsRequired();
        builder.Property(p => p.Excerpt).HasMaxLength(500);
        builder.Property(p => p.HeroImageUrl).HasMaxLength(1000);
        builder.Property(p => p.Origin).HasMaxLength(200);
        builder.Property(p => p.Destination).HasMaxLength(200);
        builder.Property(p => p.Category).HasMaxLength(50);
        builder.Property(p => p.MetaTitle).HasMaxLength(200);
        builder.Property(p => p.MetaDescription).HasMaxLength(500);
        builder.Property(p => p.CanonicalUrl).HasMaxLength(1000);
        builder.Property(p => p.StructuredData);
    }
}
