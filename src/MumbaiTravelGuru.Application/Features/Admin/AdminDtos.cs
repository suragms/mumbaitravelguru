namespace MumbaiTravelGuru.Application.Features.Admin;

public class AdminBookingListItemDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string BookingType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? ConfirmationNumber { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool NeedsReconciliation { get; set; }
}

public class AdminBookingDetailDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string BookingType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? ConfirmationNumber { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool NeedsReconciliation { get; set; }
    public List<AdminPaymentDto> Payments { get; set; } = new();
    public List<AdminRefundDto> Refunds { get; set; } = new();
}

public class AdminPaymentDto
{
    public Guid Id { get; set; }
    public string Method { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? GatewayOrderId { get; set; }
    public string? GatewayTransactionId { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public class AdminRefundDto
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? GatewayRefundId { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Roles { get; set; } = new();
}

public class AdminDashboardDto
{
    public int TotalBookingsToday { get; set; }
    public int TotalBookingsThisMonth { get; set; }
    public decimal RevenueToday { get; set; }
    public decimal RevenueThisMonth { get; set; }
    public int PendingReconciliationCount { get; set; }
    public List<RevenueByVerticalDto> RevenueByVertical { get; set; } = new();
    public List<BookingsPerDayDto> BookingsPerDay { get; set; } = new();
    public List<TopRouteDto> TopRoutes { get; set; } = new();
    public ConversionFunnelDto ConversionFunnel { get; set; } = new();
}

public class RevenueByVerticalDto
{
    public string Vertical { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int BookingCount { get; set; }
}

public class BookingsPerDayDto
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Revenue { get; set; }
}

public class TopRouteDto
{
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public int Count { get; set; }
    public string? DestinationName { get; set; }
}

public class ConversionFunnelDto
{
    public int TotalSearches { get; set; }
    public int TotalInitiations { get; set; }
    public int TotalConfirmations { get; set; }
    public double SearchToInitiateRate { get; set; }
    public double InitiateToConfirmRate { get; set; }
    public double OverallConversionRate { get; set; }
}

public class AdminAuditLogDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Details { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AssignRoleRequestDto
{
    public Guid UserId { get; set; }
    public string Role { get; set; } = string.Empty;
}

public class ResendVoucherRequestDto
{
    public Guid BookingId { get; set; }
}
