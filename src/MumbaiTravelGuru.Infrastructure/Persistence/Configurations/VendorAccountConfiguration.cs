using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class VendorAccountConfiguration : IEntityTypeConfiguration<VendorAccount>
{
    public void Configure(EntityTypeBuilder<VendorAccount> builder)
    {
        builder.ToTable("VendorAccounts");
        builder.HasKey(v => v.Id);

        builder.HasOne(v => v.User)
            .WithMany()
            .HasForeignKey(v => v.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(v => v.BusinessName).HasMaxLength(200).IsRequired();
        builder.Property(v => v.BusinessType).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(v => v.ContactEmail).HasMaxLength(200);
        builder.Property(v => v.ContactPhone).HasMaxLength(20);
        builder.Property(v => v.Address).HasMaxLength(500);
        builder.Property(v => v.GSTIN).HasMaxLength(50);
        builder.Property(v => v.CommissionRate).HasColumnType("decimal(5,2)");

        builder.HasIndex(v => v.UserId).IsUnique();
    }
}

public class VendorListingConfiguration : IEntityTypeConfiguration<VendorListing>
{
    public void Configure(EntityTypeBuilder<VendorListing> builder)
    {
        builder.ToTable("VendorListings");
        builder.HasKey(l => l.Id);

        builder.HasOne(l => l.VendorAccount)
            .WithMany(v => v.Listings)
            .HasForeignKey(l => l.VendorAccountId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(l => l.ListingType).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(l => l.Title).HasMaxLength(300).IsRequired();
        builder.Property(l => l.Description).HasMaxLength(2000);
        builder.Property(l => l.DefaultPrice).HasColumnType("decimal(18,2)");
        builder.Property(l => l.Currency).HasMaxLength(3);
    }
}

public class VendorAvailabilityCalendarConfiguration : IEntityTypeConfiguration<VendorAvailabilityCalendar>
{
    public void Configure(EntityTypeBuilder<VendorAvailabilityCalendar> builder)
    {
        builder.ToTable("VendorAvailabilityCalendars");
        builder.HasKey(c => c.Id);

        builder.HasOne(c => c.VendorListing)
            .WithMany(l => l.Availability)
            .HasForeignKey(c => c.VendorListingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(c => c.PriceOverride).HasColumnType("decimal(18,2)");
        builder.Property(c => c.Notes).HasMaxLength(500);

        builder.HasIndex(c => new { c.VendorListingId, c.Date }).IsUnique();
    }
}

public class VendorBookingConfiguration : IEntityTypeConfiguration<VendorBooking>
{
    public void Configure(EntityTypeBuilder<VendorBooking> builder)
    {
        builder.ToTable("VendorBookings");
        builder.HasKey(b => b.Id);

        builder.HasOne(b => b.VendorAccount)
            .WithMany(v => v.Bookings)
            .HasForeignKey(b => b.VendorAccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.VendorListing)
            .WithMany(l => l.Bookings)
            .HasForeignKey(b => b.VendorListingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Booking)
            .WithMany()
            .HasForeignKey(b => b.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(b => b.GuestName).HasMaxLength(200);
        builder.Property(b => b.GuestContact).HasMaxLength(20);
        builder.Property(b => b.GuestEmail).HasMaxLength(200);
        builder.Property(b => b.TotalAmount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(b => b.CommissionAmount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(b => b.NetAmount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(b => b.Currency).HasMaxLength(3).IsRequired();
        builder.Property(b => b.Status).HasMaxLength(30).IsRequired();

        builder.HasIndex(b => b.VendorAccountId);
        builder.HasIndex(b => b.BookingId);
    }
}

public class VendorCommissionConfiguration : IEntityTypeConfiguration<VendorCommission>
{
    public void Configure(EntityTypeBuilder<VendorCommission> builder)
    {
        builder.ToTable("VendorCommissions");
        builder.HasKey(c => c.Id);

        builder.HasOne(c => c.VendorAccount)
            .WithMany(v => v.Commissions)
            .HasForeignKey(c => c.VendorAccountId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(c => c.ListingType).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(c => c.CommissionRate).HasColumnType("decimal(5,2)").IsRequired();
    }
}

public class VendorPayoutConfiguration : IEntityTypeConfiguration<VendorPayout>
{
    public void Configure(EntityTypeBuilder<VendorPayout> builder)
    {
        builder.ToTable("VendorPayouts");
        builder.HasKey(p => p.Id);

        builder.HasOne(p => p.VendorAccount)
            .WithMany(v => v.Payouts)
            .HasForeignKey(p => p.VendorAccountId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(p => p.Amount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(p => p.CommissionAmount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(p => p.NetAmount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(p => p.Currency).HasMaxLength(3).IsRequired();
        builder.Property(p => p.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(p => p.TransactionReference).HasMaxLength(100);
        builder.Property(p => p.Notes).HasMaxLength(500);

        builder.HasIndex(p => p.VendorAccountId);
    }
}

public class VendorPayoutLineItemConfiguration : IEntityTypeConfiguration<VendorPayoutLineItem>
{
    public void Configure(EntityTypeBuilder<VendorPayoutLineItem> builder)
    {
        builder.ToTable("VendorPayoutLineItems");
        builder.HasKey(i => i.Id);

        builder.HasOne(i => i.VendorPayout)
            .WithMany(p => p.LineItems)
            .HasForeignKey(i => i.VendorPayoutId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.VendorBooking)
            .WithMany()
            .HasForeignKey(i => i.VendorBookingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(i => i.BookingAmount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(i => i.CommissionAmount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(i => i.NetAmount).HasColumnType("decimal(18,2)").IsRequired();
    }
}
