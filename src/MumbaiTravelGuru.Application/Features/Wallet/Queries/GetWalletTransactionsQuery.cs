using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Wallet;

namespace MumbaiTravelGuru.Application.Features.Wallet.Queries
{
    public record GetWalletTransactionsQuery(Guid UserId) : IRequest<List<WalletTransactionDto>>;

    public class GetWalletTransactionsQueryHandler : IRequestHandler<GetWalletTransactionsQuery, List<WalletTransactionDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetWalletTransactionsQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<WalletTransactionDto>> Handle(GetWalletTransactionsQuery request, CancellationToken cancellationToken)
        {
            var wallet = await _context.Wallets
                .AsNoTracking()
                .FirstOrDefaultAsync(w => w.UserId == request.UserId, cancellationToken);

            if (wallet == null) return new List<WalletTransactionDto>();

            var transactions = await _context.WalletTransactions
                .AsNoTracking()
                .Where(t => t.WalletId == wallet.Id)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new WalletTransactionDto
                {
                    Id = t.Id,
                    WalletId = t.WalletId,
                    Amount = t.Amount,
                    Type = t.Type.ToString(),
                    Status = t.Status.ToString(),
                    Description = t.Description,
                    ReferenceId = t.ReferenceId,
                    CreatedAt = t.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return transactions;
        }
    }
}
