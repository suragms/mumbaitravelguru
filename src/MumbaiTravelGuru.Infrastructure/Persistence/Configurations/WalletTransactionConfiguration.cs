using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence.Configurations;

public class WalletTransactionConfiguration : IEntityTypeConfiguration<WalletTransaction>
{
    public void Configure(EntityTypeBuilder<WalletTransaction> builder)
    {
        builder.ToTable("WalletTransactions");

        builder.HasKey(wt => wt.Id);
        builder.Property(wt => wt.Id).ValueGeneratedNever();

        builder.Property(wt => wt.Amount).HasPrecision(18, 2);
        builder.Property(wt => wt.Description).HasMaxLength(500);
        builder.Property(wt => wt.ReferenceId).HasMaxLength(100);

        builder.Property(wt => wt.Type)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(wt => wt.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasOne(wt => wt.Wallet)
            .WithMany(w => w.Transactions)
            .HasForeignKey(wt => wt.WalletId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(wt => wt.CreatedAt).IsRequired();
        builder.Property(wt => wt.IsDeleted).HasDefaultValue(false);
        builder.HasQueryFilter(wt => !wt.IsDeleted);
    }
}
