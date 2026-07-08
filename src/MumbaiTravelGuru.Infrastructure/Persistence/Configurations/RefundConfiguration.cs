using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class RefundConfiguration : IEntityTypeConfiguration<Refund>
{
    public void Configure(EntityTypeBuilder<Refund> builder)
    {
        builder.ToTable("Refunds");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedNever();

        builder.Property(r => r.Amount).HasPrecision(18, 2);
        builder.Property(r => r.Currency).HasMaxLength(3).HasDefaultValue("INR");

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(r => r.Reason).HasMaxLength(500);
        builder.Property(r => r.GatewayRefundId).HasMaxLength(200);

        builder.HasOne(r => r.Payment)
            .WithMany(p => p.Refunds)
            .HasForeignKey(r => r.PaymentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Booking)
            .WithMany()
            .HasForeignKey(r => r.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(r => r.CreatedAt).IsRequired();
        builder.Property(r => r.UpdatedAt);
        builder.Property(r => r.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(r => !r.IsDeleted);
    }
}
