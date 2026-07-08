using System;

namespace MumbaiTravelGuru.Application.DTOs.Wallet
{
    public class WalletTransactionDto
    {
        public Guid Id { get; set; }
        public Guid WalletId { get; set; }
        public decimal Amount { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ReferenceId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
