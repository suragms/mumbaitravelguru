using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class GuestReviewConfiguration : IEntityTypeConfiguration<GuestReview>
{
    public void Configure(EntityTypeBuilder<GuestReview> builder)
    {
        builder.ToTable("GuestReviews");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedNever();

        builder.Property(r => r.Comment).IsRequired().HasMaxLength(2000);
        builder.Property(r => r.HotelId).HasMaxLength(50);
        builder.Property(r => r.HotelName).HasMaxLength(200);

        builder.HasOne(r => r.Booking)
            .WithMany()
            .HasForeignKey(r => r.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(r => r.CreatedAt).IsRequired();
        builder.Property(r => r.UpdatedAt);
        builder.Property(r => r.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(r => !r.IsDeleted);
    }
}
