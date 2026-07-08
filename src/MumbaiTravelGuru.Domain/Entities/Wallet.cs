using MumbaiTravelGuru.Domain.Common;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Domain.Entities;

public class Wallet : BaseEntity
{
    public Guid UserId { get; set; }
    public decimal Balance { get; set; }
    public string Currency { get; set; } = "INR";

    public User User { get; set; } = null!;
    public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();

    public WalletTransaction Credit(decimal amount, string description, string referenceId = "")
    {
        if (amount <= 0)
            throw new ArgumentException("Credit amount must be positive.", nameof(amount));

        Balance += amount;
        UpdatedAt = DateTime.UtcNow;

        var txn = new WalletTransaction
        {
            WalletId = Id,
            Amount = amount,
            Type = WalletTransactionType.Credit,
            Status = WalletTransactionStatus.Success,
            Description = description,
            ReferenceId = referenceId,
        };
        Transactions.Add(txn);
        return txn;
    }

    public WalletTransaction Debit(decimal amount, string description, string referenceId = "")
    {
        if (amount <= 0)
            throw new ArgumentException("Debit amount must be positive.", nameof(amount));
        if (Balance < amount)
            throw new InvalidOperationException("Insufficient funds.");

        Balance -= amount;
        UpdatedAt = DateTime.UtcNow;

        var txn = new WalletTransaction
        {
            WalletId = Id,
            Amount = amount,
            Type = WalletTransactionType.Debit,
            Status = WalletTransactionStatus.Success,
            Description = description,
            ReferenceId = referenceId,
        };
        Transactions.Add(txn);
        return txn;
    }
}
