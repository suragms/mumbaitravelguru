using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> builder)
    {
        builder.ToTable("Coupons");

        builder.HasKey(c => c.Id);

        builder.HasIndex(c => c.Code).IsUnique();

        builder.Property(c => c.Code).HasMaxLength(50).IsRequired();
        builder.Property(c => c.Type).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(c => c.Value).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(c => c.MaxDiscountAmount).HasColumnType("decimal(18,2)");
        builder.Property(c => c.MinBookingValue).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(c => c.ApplicableVerticals).HasMaxLength(200).IsRequired();
        builder.Property(c => c.CurrentUsageCount).IsRequired();
        builder.Property(c => c.Description).HasMaxLength(500);
    }
}

public class CouponUsageConfiguration : IEntityTypeConfiguration<CouponUsage>
{
    public void Configure(EntityTypeBuilder<CouponUsage> builder)
    {
        builder.ToTable("CouponUsages");

        builder.HasKey(u => u.Id);

        builder.HasOne(u => u.Coupon)
            .WithMany()
            .HasForeignKey(u => u.CouponId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.User)
            .WithMany()
            .HasForeignKey(u => u.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.Booking)
            .WithMany()
            .HasForeignKey(u => u.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(u => u.DiscountedAmount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(u => u.Currency).HasMaxLength(3).IsRequired();

        builder.HasIndex(u => new { u.CouponId, u.UserId });
    }
}
