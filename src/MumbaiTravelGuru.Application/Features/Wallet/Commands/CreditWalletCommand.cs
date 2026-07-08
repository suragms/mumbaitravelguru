using System;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Wallet;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Features.Wallet.Commands
{
    public record CreditWalletCommand(
        Guid UserId,
        decimal Amount,
        string Description,
        string ReferenceId = "") : IRequest<WalletTransactionDto>;

    public class CreditWalletCommandValidator : AbstractValidator<CreditWalletCommand>
    {
        public CreditWalletCommandValidator()
        {
            RuleFor(v => v.UserId).NotEmpty();
            RuleFor(v => v.Amount).GreaterThan(0).WithMessage("Credit amount must be greater than zero.");
            RuleFor(v => v.Description).NotEmpty().MaximumLength(200);
        }
    }

    public class CreditWalletCommandHandler : IRequestHandler<CreditWalletCommand, WalletTransactionDto>
    {
        private readonly IApplicationDbContext _context;
        private readonly IDateTime _dateTime;

        public CreditWalletCommandHandler(IApplicationDbContext context, IDateTime dateTime)
        {
            _context = context;
            _dateTime = dateTime;
        }

        public async Task<WalletTransactionDto> Handle(CreditWalletCommand request, CancellationToken cancellationToken)
        {
            var wallet = await _context.Wallets
                .FirstOrDefaultAsync(w => w.UserId == request.UserId, cancellationToken);

            if (wallet == null)
                throw new InvalidOperationException("User wallet not found.");

            // Idempotency check: if referenceId is provided, check if transaction already exists
            if (!string.IsNullOrWhiteSpace(request.ReferenceId))
            {
                var existingTx = await _context.WalletTransactions
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.WalletId == wallet.Id && t.ReferenceId == request.ReferenceId && t.Type == Domain.Enums.WalletTransactionType.Credit, cancellationToken);

                if (existingTx != null)
                {
                    return new WalletTransactionDto
                    {
                        Id = existingTx.Id,
                        WalletId = existingTx.WalletId,
                        Amount = existingTx.Amount,
                        Type = existingTx.Type.ToString(),
                        Status = existingTx.Status.ToString(),
                        Description = existingTx.Description,
                        ReferenceId = existingTx.ReferenceId,
                        CreatedAt = existingTx.CreatedAt
                    };
                }
            }

            var transaction = wallet.Credit(request.Amount, request.Description, request.ReferenceId);

            var userEmail = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == request.UserId)
                .Select(u => u.Email)
                .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

            var auditLog = new AuditLog
            {
                Action = "WalletCredit",
                UserId = wallet.UserId,
                UserEmail = userEmail,
                Details = $"Credited {wallet.Currency} {request.Amount:F2}. Reason: {request.Description}. New Balance: {wallet.Currency} {wallet.Balance:F2}",
            };
            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync(cancellationToken);

            return new WalletTransactionDto
            {
                Id = transaction.Id,
                WalletId = transaction.WalletId,
                Amount = transaction.Amount,
                Type = transaction.Type.ToString(),
                Status = transaction.Status.ToString(),
                Description = transaction.Description,
                ReferenceId = transaction.ReferenceId,
                CreatedAt = transaction.CreatedAt
            };
        }
    }
}
