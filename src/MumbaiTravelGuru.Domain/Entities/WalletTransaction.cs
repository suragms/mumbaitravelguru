using MumbaiTravelGuru.Domain.Common;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Domain.Entities;

public class WalletTransaction : BaseEntity
{
    public Guid WalletId { get; set; }
    public decimal Amount { get; set; }
    public WalletTransactionType Type { get; set; }
    public WalletTransactionStatus Status { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? ReferenceId { get; set; }

    public Wallet Wallet { get; set; } = null!;
}
