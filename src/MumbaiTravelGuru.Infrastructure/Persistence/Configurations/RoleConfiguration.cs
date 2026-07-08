using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedNever();

        builder.Property(r => r.Name).IsRequired().HasMaxLength(50);
        builder.HasIndex(r => r.Name).IsUnique();

        builder.Property(r => r.Description).HasMaxLength(255);

        builder.Property(r => r.CreatedAt).IsRequired();
        builder.Property(r => r.UpdatedAt);
        builder.Property(r => r.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(r => !r.IsDeleted);
    }
}
