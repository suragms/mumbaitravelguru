using System;
using System.Collections.Generic;

namespace MumbaiTravelGuru.Domain.Common.ValueObjects
{
    public class Money : IEquatable<Money>
    {
        public decimal Amount { get; }
        public string Currency { get; }

        private Money(decimal amount, string currency = "INR")
        {
            if (amount < 0)
                throw new ArgumentException("Amount cannot be negative.", nameof(amount));

            Amount = decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
            Currency = currency;
        }

        public static Money FromDecimal(decimal amount, string currency = "INR")
        {
            return new Money(amount, currency);
        }

        public static Money Zero(string currency = "INR")
        {
            return new Money(0, currency);
        }

        public Money Add(Money other)
        {
            ValidateCurrency(other);
            return new Money(Amount + other.Amount, Currency);
        }

        public Money Subtract(Money other)
        {
            ValidateCurrency(other);
            if (Amount < other.Amount)
                throw new InvalidOperationException("Insufficient funds for this transaction.");
            return new Money(Amount - other.Amount, Currency);
        }

        private void ValidateCurrency(Money other)
        {
            if (Currency != other.Currency)
                throw new InvalidOperationException($"Cannot operate on different currencies: {Currency} and {other.Currency}");
        }

        public bool Equals(Money? other)
        {
            if (other is null) return false;
            return Amount == other.Amount && Currency == other.Currency;
        }

        public override bool Equals(object? obj)
        {
            return obj is Money other && Equals(other);
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Amount, Currency);
        }

        public static bool operator ==(Money? left, Money? right)
        {
            if (left is null) return right is null;
            return left.Equals(right);
        }

        public static bool operator !=(Money? left, Money? right)
        {
            return !(left == right);
        }

        public override string ToString()
        {
            return $"{Currency} {Amount:F2}";
        }
    }
}
