using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).ValueGeneratedNever();

        builder.Property(u => u.Email).IsRequired().HasMaxLength(150);
        builder.HasIndex(u => u.Email).IsUnique();

        builder.Property(u => u.PasswordHash).IsRequired().HasMaxLength(500);
        builder.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(u => u.LastName).IsRequired().HasMaxLength(100);
        builder.Property(u => u.PhoneNumber).HasMaxLength(20);

        builder.Property(u => u.RefreshToken).HasMaxLength(500);
        builder.Property(u => u.RefreshTokenExpiry);
        builder.Property(u => u.GoogleId).HasMaxLength(200);
        builder.HasIndex(u => u.GoogleId).IsUnique().HasFilter("\"GoogleId\" IS NOT NULL");
        builder.Property(u => u.GoogleEmail).HasMaxLength(150);

        builder.Property(u => u.CreatedAt).IsRequired();
        builder.Property(u => u.UpdatedAt);
        builder.Property(u => u.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(u => !u.IsDeleted);
    }
}
