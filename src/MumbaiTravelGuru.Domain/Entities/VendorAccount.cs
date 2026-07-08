using MumbaiTravelGuru.Domain.Common;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Domain.Entities;

public class VendorAccount : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string BusinessName { get; set; } = string.Empty;
    public VendorBusinessType BusinessType { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public string? GSTIN { get; set; }
    public bool IsOnboarded { get; set; }
    public decimal? CommissionRate { get; set; }

    public ICollection<VendorListing> Listings { get; set; } = new List<VendorListing>();
    public ICollection<VendorBooking> Bookings { get; set; } = new List<VendorBooking>();
    public ICollection<VendorCommission> Commissions { get; set; } = new List<VendorCommission>();
    public ICollection<VendorPayout> Payouts { get; set; } = new List<VendorPayout>();
}

public class VendorListing : BaseEntity
{
    public Guid VendorAccountId { get; set; }
    public VendorAccount VendorAccount { get; set; } = null!;
    public VendorListingType ListingType { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? DefaultPrice { get; set; }
    public string? Currency { get; set; } = "INR";
    public bool IsActive { get; set; } = true;

    public ICollection<VendorAvailabilityCalendar> Availability { get; set; } = new List<VendorAvailabilityCalendar>();
    public ICollection<VendorBooking> Bookings { get; set; } = new List<VendorBooking>();
}

public class VendorAvailabilityCalendar : BaseEntity
{
    public Guid VendorListingId { get; set; }
    public VendorListing VendorListing { get; set; } = null!;
    public DateTime Date { get; set; }
    public bool IsAvailable { get; set; } = true;
    public int? AvailableUnits { get; set; }
    public decimal? PriceOverride { get; set; }
    public string? Notes { get; set; }
}

public class VendorBooking : BaseEntity
{
    public Guid VendorAccountId { get; set; }
    public VendorAccount VendorAccount { get; set; } = null!;
    public Guid VendorListingId { get; set; }
    public VendorListing VendorListing { get; set; } = null!;
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public string? GuestName { get; set; }
    public string? GuestContact { get; set; }
    public string? GuestEmail { get; set; }
    public DateTime? CheckIn { get; set; }
    public DateTime? CheckOut { get; set; }
    public int Units { get; set; } = 1;
    public decimal TotalAmount { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal NetAmount { get; set; }
    public string Currency { get; set; } = "INR";
    public string Status { get; set; } = "Confirmed";
    public DateTime? CompletedAt { get; set; }
}

public class VendorCommission : BaseEntity
{
    public Guid VendorAccountId { get; set; }
    public VendorAccount VendorAccount { get; set; } = null!;
    public VendorListingType ListingType { get; set; }
    public decimal CommissionRate { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;
}

public class VendorPayout : BaseEntity
{
    public Guid VendorAccountId { get; set; }
    public VendorAccount VendorAccount { get; set; } = null!;
    public decimal Amount { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal NetAmount { get; set; }
    public string Currency { get; set; } = "INR";
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public VendorPayoutStatus Status { get; set; } = VendorPayoutStatus.Pending;
    public DateTime? PaidAt { get; set; }
    public string? TransactionReference { get; set; }
    public string? Notes { get; set; }

    public ICollection<VendorPayoutLineItem> LineItems { get; set; } = new List<VendorPayoutLineItem>();
}

public class VendorPayoutLineItem : BaseEntity
{
    public Guid VendorPayoutId { get; set; }
    public VendorPayout VendorPayout { get; set; } = null!;
    public Guid VendorBookingId { get; set; }
    public VendorBooking VendorBooking { get; set; } = null!;
    public decimal BookingAmount { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal NetAmount { get; set; }
}
