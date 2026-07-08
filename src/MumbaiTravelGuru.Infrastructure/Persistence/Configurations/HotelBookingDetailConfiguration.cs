using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class HotelBookingDetailConfiguration : IEntityTypeConfiguration<HotelBookingDetail>
{
    public void Configure(EntityTypeBuilder<HotelBookingDetail> builder)
    {
        builder.ToTable("HotelBookingDetails");

        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).ValueGeneratedNever();

        builder.Property(h => h.FareLockId).HasMaxLength(100);
        builder.Property(h => h.OfferId).HasMaxLength(50);
        builder.Property(h => h.HotelId).HasMaxLength(50);
        builder.Property(h => h.HotelName).HasMaxLength(200);
        builder.Property(h => h.HotelAddress).HasMaxLength(500);
        builder.Property(h => h.City).HasMaxLength(100);
        builder.Property(h => h.Country).HasMaxLength(100);
        builder.Property(h => h.BoardType).HasMaxLength(50);
        builder.Property(h => h.BookingReference).HasMaxLength(20);
        builder.Property(h => h.VoucherUrl).HasMaxLength(500);
        builder.Property(h => h.CancellationPolicy).HasMaxLength(500);
        builder.Property(h => h.ActionStatus).HasMaxLength(20);

        builder.HasOne(h => h.Booking)
            .WithMany()
            .HasForeignKey(h => h.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(h => h.BookedRooms)
            .WithOne(r => r.HotelBookingDetail)
            .HasForeignKey(r => r.HotelBookingDetailId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(h => h.CreatedAt).IsRequired();
        builder.Property(h => h.UpdatedAt);
        builder.Property(h => h.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(h => !h.IsDeleted);
    }
}

public class HotelBookedRoomConfiguration : IEntityTypeConfiguration<HotelBookedRoom>
{
    public void Configure(EntityTypeBuilder<HotelBookedRoom> builder)
    {
        builder.ToTable("HotelBookedRooms");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedNever();

        builder.Property(r => r.RoomType).IsRequired().HasMaxLength(100);
        builder.Property(r => r.BoardType).HasMaxLength(50);

        builder.Property(r => r.CreatedAt).IsRequired();
        builder.Property(r => r.UpdatedAt);
        builder.Property(r => r.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(r => !r.IsDeleted);
    }
}
