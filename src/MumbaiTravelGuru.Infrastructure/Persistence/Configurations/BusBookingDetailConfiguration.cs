using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class BusBookingDetailConfiguration : IEntityTypeConfiguration<BusBookingDetail>
{
    public void Configure(EntityTypeBuilder<BusBookingDetail> builder)
    {
        builder.ToTable("BusBookingDetails");

        builder.HasKey(d => d.Id);

        builder.HasOne(d => d.Booking)
            .WithMany()
            .HasForeignKey(d => d.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(d => d.FareLockId).HasMaxLength(100);
        builder.Property(d => d.TripId).HasMaxLength(50).IsRequired();
        builder.Property(d => d.OperatorName).HasMaxLength(200).IsRequired();
        builder.Property(d => d.BusType).HasMaxLength(100);
        builder.Property(d => d.Origin).HasMaxLength(100).IsRequired();
        builder.Property(d => d.Destination).HasMaxLength(100).IsRequired();
        builder.Property(d => d.BoardingPointId).HasMaxLength(50);
        builder.Property(d => d.BoardingPointName).HasMaxLength(200);
        builder.Property(d => d.DroppingPointId).HasMaxLength(50);
        builder.Property(d => d.DroppingPointName).HasMaxLength(200);
        builder.Property(d => d.Currency).HasMaxLength(3).IsRequired();
        builder.Property(d => d.BookingReference).HasMaxLength(50);
        builder.Property(d => d.TicketUrl).HasMaxLength(500);
        builder.Property(d => d.ActionStatus).HasMaxLength(50).IsRequired();

        builder.HasMany(d => d.BookedSeats)
            .WithOne(s => s.BusBookingDetail)
            .HasForeignKey(s => s.BusBookingDetailId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class BusBookedSeatConfiguration : IEntityTypeConfiguration<BusBookedSeat>
{
    public void Configure(EntityTypeBuilder<BusBookedSeat> builder)
    {
        builder.ToTable("BusBookedSeats");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.SeatLabel).HasMaxLength(20).IsRequired();
        builder.Property(s => s.Deck).HasMaxLength(20);
        builder.Property(s => s.PassengerName).HasMaxLength(200);
        builder.Property(s => s.Gender).HasMaxLength(20);
    }
}
