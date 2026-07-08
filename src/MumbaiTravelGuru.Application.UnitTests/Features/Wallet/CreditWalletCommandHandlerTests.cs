using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.Features.Wallet.Commands;
using MumbaiTravelGuru.Domain.Entities;
using WalletEntity = MumbaiTravelGuru.Domain.Entities.Wallet;
using MumbaiTravelGuru.Infrastructure.Persistence;
using NSubstitute;
using MumbaiTravelGuru.Application.DTOs.Wallet;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Features.Wallet;

public class CreditWalletCommandHandlerTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly IDateTime _dateTime;

    public CreditWalletCommandHandlerTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _dateTime = Substitute.For<IDateTime>();
        _dateTime.UtcNow.Returns(DateTime.UtcNow);
    }

    [Fact]
    public async Task Handle_WithValidRequest_ShouldCreditWalletAndCreateAuditLog()
    {
        var userId = Guid.NewGuid();

        using (var context = new ApplicationDbContext(_options))
        {
            var user = new User
            {
                Email = "test@example.com",
                FirstName = "Test",
                LastName = "User"
            };

            user.Id = userId;

            var wallet = new WalletEntity
            {
                UserId = userId
            };

            context.Users.Add(user);
            context.Wallets.Add(wallet);
            await context.SaveChangesAsync();
        }

        var command = new CreditWalletCommand(userId, 150.00m, "Refund flight", "ref-refund-1");

        WalletTransactionDto result;
        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new CreditWalletCommandHandler(context, _dateTime);
            result = await handler.Handle(command, CancellationToken.None);
        }

        Assert.NotNull(result);
        Assert.Equal(150.00m, result.Amount);
        Assert.Equal("Credit", result.Type);
        Assert.Equal("ref-refund-1", result.ReferenceId);

        using (var context = new ApplicationDbContext(_options))
        {
            var updatedWallet = await context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
            Assert.Equal(150.00m, updatedWallet!.Balance);

            var auditLog = await context.AuditLogs.FirstOrDefaultAsync(l => l.UserId == userId);
            Assert.NotNull(auditLog);
            Assert.Equal("WalletCredit", auditLog.Action);
            Assert.Contains("New Balance: INR 150.00", auditLog.Details);
        }
    }

    [Fact]
    public async Task Handle_WithDuplicateReferenceId_ShouldBeIdempotentAndNotDoubleCredit()
    {
        var userId = Guid.NewGuid();
        using (var context = new ApplicationDbContext(_options))
        {
            var user = new User
            {
                Email = "test@example.com",
                FirstName = "Test",
                LastName = "User"
            };

            user.Id = userId;

            var wallet = new WalletEntity
            {
                UserId = userId
            };

            context.Users.Add(user);
            context.Wallets.Add(wallet);
            await context.SaveChangesAsync();
        }

        var command1 = new CreditWalletCommand(userId, 100.00m, "Promo Credit", "promo-ref");
        var command2 = new CreditWalletCommand(userId, 100.00m, "Promo Credit", "promo-ref");

        WalletTransactionDto result1;
        WalletTransactionDto result2;

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new CreditWalletCommandHandler(context, _dateTime);
            result1 = await handler.Handle(command1, CancellationToken.None);
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new CreditWalletCommandHandler(context, _dateTime);
            result2 = await handler.Handle(command2, CancellationToken.None);
        }

        Assert.NotNull(result1);
        Assert.NotNull(result2);
        Assert.Equal(result1.Id, result2.Id);

        using (var context = new ApplicationDbContext(_options))
        {
            var updatedWallet = await context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
            Assert.Equal(100.00m, updatedWallet!.Balance);

            var transactionCount = await context.WalletTransactions.CountAsync(t => t.WalletId == updatedWallet.Id);
            Assert.Equal(1, transactionCount);
        }
    }
}
