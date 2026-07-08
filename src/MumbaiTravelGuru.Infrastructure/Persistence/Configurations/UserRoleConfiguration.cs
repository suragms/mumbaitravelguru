using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> builder)
    {
        builder.ToTable("UserRoles");

        builder.HasKey(ur => ur.Id);
        builder.Property(ur => ur.Id).ValueGeneratedNever();

        builder.HasIndex(ur => new { ur.UserId, ur.RoleId }).IsUnique();

        builder.HasOne(ur => ur.User)
            .WithMany(u => u.UserRoles)
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ur => ur.Role)
            .WithMany(r => r.UserRoles)
            .HasForeignKey(ur => ur.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(ur => ur.CreatedAt).IsRequired();
        builder.Property(ur => ur.UpdatedAt);
        builder.Property(ur => ur.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(ur => !ur.IsDeleted);
    }
}
