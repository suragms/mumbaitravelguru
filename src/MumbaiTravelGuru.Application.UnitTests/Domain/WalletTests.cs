using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Domain;

public class WalletTests
{
    [Fact]
    public void InitialWallet_ShouldHaveZeroBalance()
    {
        var wallet = new Wallet();
        Assert.Equal(0m, wallet.Balance);
        Assert.Equal("INR", wallet.Currency);
    }

    [Fact]
    public void Credit_ShouldIncreaseBalance_AndCreateSuccessTransaction()
    {
        var wallet = new Wallet();
        var transaction = wallet.Credit(100.50m, "Test Credit", "ref-123");

        Assert.Equal(100.50m, wallet.Balance);
        Assert.Single(wallet.Transactions);
        Assert.Equal(100.50m, transaction.Amount);
        Assert.Equal(WalletTransactionType.Credit, transaction.Type);
        Assert.Equal(WalletTransactionStatus.Success, transaction.Status);
        Assert.Equal("ref-123", transaction.ReferenceId);
    }

    [Fact]
    public void Debit_ShouldDecreaseBalance_AndCreateSuccessTransaction()
    {
        var wallet = new Wallet();
        wallet.Credit(200.00m, "Initial Credit");

        var transaction = wallet.Debit(50.25m, "Test Debit", "ref-456");

        Assert.Equal(149.75m, wallet.Balance);
        Assert.Equal(2, wallet.Transactions.Count);
        Assert.Equal(50.25m, transaction.Amount);
        Assert.Equal(WalletTransactionType.Debit, transaction.Type);
        Assert.Equal(WalletTransactionStatus.Success, transaction.Status);
        Assert.Equal("ref-456", transaction.ReferenceId);
    }

    [Fact]
    public void Debit_WithInsufficientFunds_ShouldThrowInvalidOperationException()
    {
        var wallet = new Wallet();
        wallet.Credit(50.00m, "Initial Credit");

        var exception = Assert.Throws<InvalidOperationException>(() => wallet.Debit(50.01m, "Test Insufficient Debit"));
        Assert.Equal("Insufficient funds.", exception.Message);
        Assert.Equal(50.00m, wallet.Balance);
    }

    [Theory]
    [InlineData(-10)]
    [InlineData(0)]
    public void Credit_WithNegativeOrZeroAmount_ShouldThrowArgumentException(decimal invalidAmount)
    {
        var wallet = new Wallet();
        Assert.Throws<ArgumentException>(() => wallet.Credit(invalidAmount, "Invalid Credit"));
    }

    [Theory]
    [InlineData(10.004, 10.00)]
    [InlineData(10.005, 10.01)]
    [InlineData(10.006, 10.01)]
    public void Credit_ShouldRoundToTwoDecimalPlaces(decimal creditAmount, decimal expectedBalance)
    {
        var wallet = new Wallet();
        wallet.Credit(creditAmount, "Rounding Test");
        Assert.Equal(expectedBalance, wallet.Balance);
    }
}
