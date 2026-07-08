using System;
using System.Collections.Generic;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Domain.Entities
{
    public class Wallet
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public decimal Balance { get; private set; }
        public string Currency { get; set; } = "INR";
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User? User { get; set; }
        public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();

        public WalletTransaction Credit(decimal amount, string description, string referenceId = "")
        {
            if (amount <= 0)
                throw new ArgumentException("Credit amount must be positive.", nameof(amount));

            Balance = decimal.Round(Balance + amount, 2, MidpointRounding.AwayFromZero);
            UpdatedAt = DateTime.UtcNow;

            var transaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = Id,
                Amount = amount,
                Type = TransactionType.Credit,
                Status = TransactionStatus.Success,
                Description = description,
                ReferenceId = referenceId,
                CreatedAt = DateTime.UtcNow
            };

            Transactions.Add(transaction);
            return transaction;
        }

        public WalletTransaction Debit(decimal amount, string description, string referenceId = "")
        {
            if (amount <= 0)
                throw new ArgumentException("Debit amount must be positive.", nameof(amount));

            if (Balance < amount)
                throw new InvalidOperationException("Insufficient funds in wallet.");

            Balance = decimal.Round(Balance - amount, 2, MidpointRounding.AwayFromZero);
            UpdatedAt = DateTime.UtcNow;

            var transaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = Id,
                Amount = amount,
                Type = TransactionType.Debit,
                Status = TransactionStatus.Success,
                Description = description,
                ReferenceId = referenceId,
                CreatedAt = DateTime.UtcNow
            };

            Transactions.Add(transaction);
            return transaction;
        }
    }
}
