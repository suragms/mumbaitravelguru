using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class FlightBookingDetailConfiguration : IEntityTypeConfiguration<FlightBookingDetail>
{
    public void Configure(EntityTypeBuilder<FlightBookingDetail> builder)
    {
        builder.ToTable("FlightBookingDetails");

        builder.HasKey(fd => fd.Id);
        builder.Property(fd => fd.Id).ValueGeneratedNever();

        builder.Property(fd => fd.FareLockId).HasMaxLength(100);
        builder.Property(fd => fd.OfferId).HasMaxLength(50);

        builder.Property(fd => fd.TripType).HasConversion<string>().HasMaxLength(20);
        builder.Property(fd => fd.CabinClass).HasConversion<string>().HasMaxLength(20);

        builder.Property(fd => fd.OriginAirport).HasMaxLength(3);
        builder.Property(fd => fd.DestinationAirport).HasMaxLength(3);

        builder.Property(fd => fd.PnrNumber).HasMaxLength(20);
        builder.Property(fd => fd.TicketStatus).HasMaxLength(30);
        builder.Property(fd => fd.ETicketUrl).HasMaxLength(500);

        builder.Property(fd => fd.ActionStatus).HasConversion<string>().HasMaxLength(20);

        builder.Property(fd => fd.SupplierLocator).HasMaxLength(50);

        builder.HasOne(fd => fd.Booking)
            .WithMany()
            .HasForeignKey(fd => fd.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(fd => fd.Passengers)
            .WithOne(p => p.FlightBookingDetail)
            .HasForeignKey(p => p.FlightBookingDetailId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(fd => fd.Segments)
            .WithOne(s => s.FlightBookingDetail)
            .HasForeignKey(s => s.FlightBookingDetailId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(fd => fd.CreatedAt).IsRequired();
        builder.Property(fd => fd.UpdatedAt);
        builder.Property(fd => fd.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(fd => !fd.IsDeleted);
    }
}

public class FlightBookingPassengerConfiguration : IEntityTypeConfiguration<FlightBookingPassenger>
{
    public void Configure(EntityTypeBuilder<FlightBookingPassenger> builder)
    {
        builder.ToTable("FlightBookingPassengers");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();

        builder.Property(p => p.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(p => p.LastName).IsRequired().HasMaxLength(100);
        builder.Property(p => p.PhoneNumber).HasMaxLength(20);
        builder.Property(p => p.Email).HasMaxLength(150);
        builder.Property(p => p.Gender).HasMaxLength(10);
        builder.Property(p => p.PassportNumber).HasMaxLength(20);
        builder.Property(p => p.Nationality).HasMaxLength(50);
        builder.Property(p => p.TicketNumber).HasMaxLength(20);
        builder.Property(p => p.SeatNumber).HasMaxLength(10);

        builder.Property(p => p.CreatedAt).IsRequired();
        builder.Property(p => p.UpdatedAt);
        builder.Property(p => p.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(p => !p.IsDeleted);
    }
}

public class FlightBookingSegmentConfiguration : IEntityTypeConfiguration<FlightBookingSegment>
{
    public void Configure(EntityTypeBuilder<FlightBookingSegment> builder)
    {
        builder.ToTable("FlightBookingSegments");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).ValueGeneratedNever();

        builder.Property(s => s.DepartureAirportCode).IsRequired().HasMaxLength(3);
        builder.Property(s => s.ArrivalAirportCode).IsRequired().HasMaxLength(3);
        builder.Property(s => s.Airline).IsRequired().HasMaxLength(100);
        builder.Property(s => s.FlightNumber).IsRequired().HasMaxLength(20);
        builder.Property(s => s.Cabin).HasMaxLength(20);

        builder.Property(s => s.CreatedAt).IsRequired();
        builder.Property(s => s.UpdatedAt);
        builder.Property(s => s.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(s => !s.IsDeleted);
    }
}
