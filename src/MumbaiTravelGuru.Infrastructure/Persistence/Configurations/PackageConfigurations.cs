using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class PackageConfiguration : IEntityTypeConfiguration<Package>
{
    public void Configure(EntityTypeBuilder<Package> builder)
    {
        builder.ToTable("Packages");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();

        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Slug).IsRequired().HasMaxLength(200);
        builder.HasIndex(p => p.Slug).IsUnique();
        builder.Property(p => p.Description).HasMaxLength(2000);
        builder.Property(p => p.Overview).HasMaxLength(4000);
        builder.Property(p => p.Destination).HasMaxLength(100);
        builder.Property(p => p.Theme).HasMaxLength(100);
        builder.Property(p => p.Currency).HasMaxLength(3);
        builder.Property(p => p.PhotoUrls).HasColumnType("text[]");
        builder.Property(p => p.Highlights).HasColumnType("text[]");

        builder.HasMany(p => p.Itineraries)
            .WithOne(i => i.Package)
            .HasForeignKey(i => i.PackageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Inclusions)
            .WithOne(i => i.Package)
            .HasForeignKey(i => i.PackageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Exclusions)
            .WithOne(e => e.Package)
            .HasForeignKey(e => e.PackageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.FixedDepartures)
            .WithOne(fd => fd.Package)
            .HasForeignKey(fd => fd.PackageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(p => p.CreatedAt).IsRequired();
        builder.Property(p => p.UpdatedAt);
        builder.Property(p => p.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(p => !p.IsDeleted);
    }
}

public class PackageItineraryConfiguration : IEntityTypeConfiguration<PackageItinerary>
{
    public void Configure(EntityTypeBuilder<PackageItinerary> builder)
    {
        builder.ToTable("PackageItineraries");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).ValueGeneratedNever();

        builder.Property(i => i.Title).IsRequired().HasMaxLength(200);
        builder.Property(i => i.Description).HasMaxLength(2000);
        builder.Property(i => i.Activities).HasColumnType("text[]");
        builder.Property(i => i.Meals).HasColumnType("text[]");
        builder.Property(i => i.Accommodation).HasMaxLength(500);

        builder.Property(i => i.CreatedAt).IsRequired();
        builder.Property(i => i.UpdatedAt);
        builder.Property(i => i.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(i => !i.IsDeleted);
    }
}

public class PackageInclusionConfiguration : IEntityTypeConfiguration<PackageInclusion>
{
    public void Configure(EntityTypeBuilder<PackageInclusion> builder)
    {
        builder.ToTable("PackageInclusions");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).ValueGeneratedNever();

        builder.Property(i => i.Description).IsRequired().HasMaxLength(500);

        builder.Property(i => i.CreatedAt).IsRequired();
        builder.Property(i => i.UpdatedAt);
        builder.Property(i => i.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(i => !i.IsDeleted);
    }
}

public class PackageExclusionConfiguration : IEntityTypeConfiguration<PackageExclusion>
{
    public void Configure(EntityTypeBuilder<PackageExclusion> builder)
    {
        builder.ToTable("PackageExclusions");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();

        builder.Property(e => e.Description).IsRequired().HasMaxLength(500);

        builder.Property(e => e.CreatedAt).IsRequired();
        builder.Property(e => e.UpdatedAt);
        builder.Property(e => e.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}

public class FixedDepartureConfiguration : IEntityTypeConfiguration<FixedDeparture>
{
    public void Configure(EntityTypeBuilder<FixedDeparture> builder)
    {
        builder.ToTable("FixedDepartures");

        builder.HasKey(fd => fd.Id);
        builder.Property(fd => fd.Id).ValueGeneratedNever();

        builder.Property(fd => fd.CreatedAt).IsRequired();
        builder.Property(fd => fd.UpdatedAt);
        builder.Property(fd => fd.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(fd => !fd.IsDeleted);
    }
}

public class PackageEnquiryConfiguration : IEntityTypeConfiguration<PackageEnquiry>
{
    public void Configure(EntityTypeBuilder<PackageEnquiry> builder)
    {
        builder.ToTable("PackageEnquiries");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();

        builder.Property(e => e.Name).IsRequired().HasMaxLength(100);
        builder.Property(e => e.Email).IsRequired().HasMaxLength(150);
        builder.Property(e => e.Phone).IsRequired().HasMaxLength(20);
        builder.Property(e => e.Message).HasMaxLength(2000);
        builder.Property(e => e.Status).HasMaxLength(20);

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Package)
            .WithMany()
            .HasForeignKey(e => e.PackageId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(e => e.CreatedAt).IsRequired();
        builder.Property(e => e.UpdatedAt);
        builder.Property(e => e.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(e => !e.IsDeleted);
    }
}

public class PackageBookingDetailConfiguration : IEntityTypeConfiguration<PackageBookingDetail>
{
    public void Configure(EntityTypeBuilder<PackageBookingDetail> builder)
    {
        builder.ToTable("PackageBookingDetails");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).ValueGeneratedNever();

        builder.Property(d => d.Currency).HasMaxLength(3);
        builder.Property(d => d.BookingReference).HasMaxLength(20);
        builder.Property(d => d.VoucherUrl).HasMaxLength(500);
        builder.Property(d => d.ActionStatus).HasMaxLength(20);

        builder.HasOne(d => d.Booking)
            .WithMany()
            .HasForeignKey(d => d.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Package)
            .WithMany()
            .HasForeignKey(d => d.PackageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.FixedDeparture)
            .WithMany()
            .HasForeignKey(d => d.FixedDepartureId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(d => d.TravelerDetails)
            .WithOne(t => t.PackageBookingDetail)
            .HasForeignKey(t => t.PackageBookingDetailId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(d => d.CreatedAt).IsRequired();
        builder.Property(d => d.UpdatedAt);
        builder.Property(d => d.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(d => !d.IsDeleted);
    }
}

public class PackageBookedTravelerConfiguration : IEntityTypeConfiguration<PackageBookedTraveler>
{
    public void Configure(EntityTypeBuilder<PackageBookedTraveler> builder)
    {
        builder.ToTable("PackageBookedTravelers");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).ValueGeneratedNever();

        builder.Property(t => t.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(t => t.LastName).IsRequired().HasMaxLength(100);
        builder.Property(t => t.PhoneNumber).HasMaxLength(20);
        builder.Property(t => t.Email).HasMaxLength(150);
        builder.Property(t => t.Gender).HasMaxLength(10);

        builder.Property(t => t.CreatedAt).IsRequired();
        builder.Property(t => t.UpdatedAt);
        builder.Property(t => t.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(t => !t.IsDeleted);
    }
}
