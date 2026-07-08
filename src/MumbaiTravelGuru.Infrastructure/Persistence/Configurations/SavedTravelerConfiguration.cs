using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class SavedTravelerConfiguration : IEntityTypeConfiguration<SavedTraveler>
{
    public void Configure(EntityTypeBuilder<SavedTraveler> builder)
    {
        builder.ToTable("SavedTravelers");

        builder.HasKey(st => st.Id);
        builder.Property(st => st.Id).ValueGeneratedNever();

        builder.Property(st => st.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(st => st.LastName).IsRequired().HasMaxLength(100);
        builder.Property(st => st.PhoneNumber).HasMaxLength(20);
        builder.Property(st => st.Gender).HasMaxLength(10);
        builder.Property(st => st.PassportNumber).HasMaxLength(20);
        builder.Property(st => st.FrequentFlyerNumber).HasMaxLength(50);
        builder.Property(st => st.Nationality).HasMaxLength(50);

        builder.HasOne(st => st.User)
            .WithMany(u => u.SavedTravelers)
            .HasForeignKey(st => st.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(st => st.CreatedAt).IsRequired();
        builder.Property(st => st.UpdatedAt);
        builder.Property(st => st.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(st => !st.IsDeleted);
    }
}
