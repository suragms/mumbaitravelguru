using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Wallet;

namespace MumbaiTravelGuru.Application.Features.Wallet.Queries
{
    public record GetWalletQuery(Guid UserId) : IRequest<WalletDto?>;

    public class GetWalletQueryHandler : IRequestHandler<GetWalletQuery, WalletDto?>
    {
        private readonly IApplicationDbContext _context;

        public GetWalletQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<WalletDto?> Handle(GetWalletQuery request, CancellationToken cancellationToken)
        {
            var wallet = await _context.Wallets
                .AsNoTracking()
                .FirstOrDefaultAsync(w => w.UserId == request.UserId, cancellationToken);

            if (wallet == null) return null;

            return new WalletDto
            {
                Id = wallet.Id,
                UserId = wallet.UserId,
                Balance = wallet.Balance,
                Currency = wallet.Currency,
                UpdatedAt = wallet.UpdatedAt
            };
        }
    }
}
