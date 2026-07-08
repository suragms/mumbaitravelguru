using System;

namespace MumbaiTravelGuru.Application.DTOs.Wallet
{
    public class WalletDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public decimal Balance { get; set; }
        public string Currency { get; set; } = "INR";
        public DateTime? UpdatedAt { get; set; }
    }
}
