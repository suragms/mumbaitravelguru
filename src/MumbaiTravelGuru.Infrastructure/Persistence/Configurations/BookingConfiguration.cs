using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.ToTable("Bookings");

        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).ValueGeneratedNever();

        builder.Property(b => b.BookingType)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(b => b.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(b => b.ConfirmationNumber).HasMaxLength(50);
        builder.HasIndex(b => b.ConfirmationNumber).IsUnique();

        builder.Property(b => b.TotalAmount).HasPrecision(18, 2);
        builder.Property(b => b.PaidAmount).HasPrecision(18, 2);
        builder.Property(b => b.Currency).HasMaxLength(3).HasDefaultValue("INR");
        builder.Property(b => b.SpecialRequests).HasMaxLength(2000);
        builder.Property(b => b.CancellationReason).HasMaxLength(500);
        builder.Property(b => b.NeedsReconciliation).HasDefaultValue(false);

        builder.HasOne(b => b.User)
            .WithMany(u => u.Bookings)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(b => b.CreatedAt).IsRequired();
        builder.Property(b => b.UpdatedAt);
        builder.Property(b => b.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(b => !b.IsDeleted);

        builder.HasIndex(b => new { b.IsDeleted, b.CreatedAt });
        builder.HasIndex(b => new { b.IsDeleted, b.Status, b.CompletedAt });
        builder.HasIndex(b => new { b.IsDeleted, b.Status, b.BookingType });
    }
}
