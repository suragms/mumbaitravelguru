namespace MumbaiTravelGuru.Application.DTOs.Vendor;

public record VendorProfileDto(
    Guid Id, string BusinessName, string BusinessType, string? ContactEmail,
    string? ContactPhone, string? Address, string? GSTIN, bool IsOnboarded,
    decimal? CommissionRate, DateTime CreatedAt);

public record UpdateVendorProfileRequestDto(
    string? BusinessName, string? ContactEmail, string? ContactPhone,
    string? Address, string? GSTIN);

public record VendorListingDto(
    Guid Id, Guid VendorAccountId, string ListingType, string Title,
    string? Description, decimal? DefaultPrice, string? Currency,
    bool IsActive, DateTime CreatedAt);

public record UpdateVendorListingRequestDto(
    string? Title, string? Description, decimal? DefaultPrice, bool? IsActive);

public record VendorAvailabilityEntryDto(
    Guid Id, DateTime Date, bool IsAvailable, int? AvailableUnits,
    decimal? PriceOverride, string? Notes);

public record UpdateAvailabilityRequestDto(
    DateTime Date, bool IsAvailable, int? AvailableUnits,
    decimal? PriceOverride, string? Notes);

public record VendorBookingDto(
    Guid Id, Guid VendorListingId, string ListingTitle, Guid BookingId,
    string? GuestName, string? GuestContact, string? GuestEmail,
    DateTime? CheckIn, DateTime? CheckOut, int Units,
    decimal TotalAmount, decimal CommissionAmount, decimal NetAmount,
    string Currency, string Status, DateTime CreatedAt);

public record VendorCommissionDto(
    Guid Id, string ListingType, decimal CommissionRate,
    DateTime EffectiveFrom, DateTime? EffectiveTo, bool IsActive);

public record VendorPayoutDto(
    Guid Id, decimal Amount, decimal CommissionAmount, decimal NetAmount,
    string Currency, DateTime PeriodStart, DateTime PeriodEnd,
    string Status, DateTime? PaidAt, string? TransactionReference,
    DateTime CreatedAt);

public record VendorPayoutDetailDto(
    Guid Id, decimal Amount, decimal CommissionAmount, decimal NetAmount,
    string Currency, DateTime PeriodStart, DateTime PeriodEnd,
    string Status, DateTime? PaidAt, string? TransactionReference,
    DateTime CreatedAt, List<VendorPayoutLineItemDto> LineItems)
    : VendorPayoutDto(Id, Amount, CommissionAmount, NetAmount, Currency,
        PeriodStart, PeriodEnd, Status, PaidAt, TransactionReference, CreatedAt);

public record VendorPayoutLineItemDto(
    Guid Id, Guid VendorBookingId, string? GuestName,
    decimal BookingAmount, decimal CommissionAmount, decimal NetAmount);

public record VendorCommissionStatementDto(
    DateTime PeriodStart, DateTime PeriodEnd,
    int TotalBookings, decimal TotalRevenue, decimal TotalCommission,
    decimal NetRevenue, List<VendorBookingDto> Bookings);

public record VendorDashboardDto(
    int ActiveListings, int TotalBookings, int PendingBookings,
    decimal TotalRevenue, decimal TotalCommission, decimal NetRevenue,
    decimal PendingPayout, VendorBookingDto? RecentBooking);
