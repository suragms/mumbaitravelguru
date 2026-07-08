using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedNever();

        builder.Property(a => a.Action).IsRequired().HasMaxLength(100);
        builder.Property(a => a.UserEmail).HasMaxLength(150);
        builder.Property(a => a.Details).HasMaxLength(4000);
        builder.Property(a => a.IpAddress).HasMaxLength(45);
        builder.Property(a => a.EntityType).HasMaxLength(100);

        builder.Property(a => a.CreatedAt).IsRequired();
        builder.Property(a => a.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(a => !a.IsDeleted);

        builder.HasIndex(a => new { a.IsDeleted, a.Action, a.CreatedAt });
    }
}
