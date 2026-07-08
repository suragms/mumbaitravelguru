using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();

        builder.Property(p => p.Method)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(p => p.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(p => p.Amount).HasPrecision(18, 2);
        builder.Property(p => p.Currency).HasMaxLength(3).HasDefaultValue("INR");
        builder.Property(p => p.TransactionId).HasMaxLength(100);
        builder.Property(p => p.GatewayTransactionId).HasMaxLength(200);
        builder.Property(p => p.GatewayOrderId).HasMaxLength(200);
        builder.Property(p => p.FailureReason).HasMaxLength(500);

        builder.HasOne(p => p.Booking)
            .WithMany(b => b.Payments)
            .HasForeignKey(p => p.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(p => p.CreatedAt).IsRequired();
        builder.Property(p => p.UpdatedAt);
        builder.Property(p => p.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(p => !p.IsDeleted);
    }
}
