using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.ToTable("Wallets");

        builder.HasKey(w => w.Id);
        builder.Property(w => w.Id).ValueGeneratedNever();

        builder.Property(w => w.Balance).HasPrecision(18, 2).HasDefaultValue(0);
        builder.Property(w => w.Currency).HasMaxLength(3).HasDefaultValue("INR");

        builder.HasOne(w => w.User)
            .WithOne(u => u.Wallet)
            .HasForeignKey<Wallet>(w => w.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(w => w.UserId).IsUnique();

        builder.Property(w => w.CreatedAt).IsRequired();
        builder.Property(w => w.UpdatedAt);
        builder.Property(w => w.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(w => !w.IsDeleted);
    }
}
