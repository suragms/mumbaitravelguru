using MumbaiTravelGuru.Domain.Common;

namespace MumbaiTravelGuru.Domain.Entities;

public class Package : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Overview { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public int DurationNights { get; set; }
    public decimal PricePerPerson { get; set; }
    public decimal? DiscountedPricePerPerson { get; set; }
    public string Currency { get; set; } = "INR";
    public string[] PhotoUrls { get; set; } = [];
    public string[] Highlights { get; set; } = [];
    public bool IsFixedDeparture { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<PackageItinerary> Itineraries { get; set; } = new List<PackageItinerary>();
    public ICollection<PackageInclusion> Inclusions { get; set; } = new List<PackageInclusion>();
    public ICollection<PackageExclusion> Exclusions { get; set; } = new List<PackageExclusion>();
    public ICollection<FixedDeparture> FixedDepartures { get; set; } = new List<FixedDeparture>();
}

public class PackageItinerary : BaseEntity
{
    public Guid PackageId { get; set; }
    public Package Package { get; set; } = null!;
    public int DayNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string[] Activities { get; set; } = [];
    public string[] Meals { get; set; } = [];
    public string? Accommodation { get; set; }
}

public class PackageInclusion : BaseEntity
{
    public Guid PackageId { get; set; }
    public Package Package { get; set; } = null!;
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class PackageExclusion : BaseEntity
{
    public Guid PackageId { get; set; }
    public Package Package { get; set; } = null!;
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class FixedDeparture : BaseEntity
{
    public Guid PackageId { get; set; }
    public Package Package { get; set; } = null!;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal PricePerPerson { get; set; }
    public decimal? DiscountedPricePerPerson { get; set; }
    public int AvailableSpots { get; set; }
    public int TotalSpots { get; set; }
    public bool IsActive { get; set; } = true;
}

public class PackageEnquiry : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid? PackageId { get; set; }
    public Package? Package { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int Travelers { get; set; }
    public DateTime? PreferredStartDate { get; set; }
    public DateTime? PreferredEndDate { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "New";
}

public class PackageBookingDetail : BaseEntity
{
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public Guid PackageId { get; set; }
    public Package Package { get; set; } = null!;
    public Guid? FixedDepartureId { get; set; }
    public FixedDeparture? FixedDeparture { get; set; }
    public int Travelers { get; set; }
    public decimal PricePerPerson { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal AmountPaid { get; set; }
    public string Currency { get; set; } = "INR";
    public string? BookingReference { get; set; }
    public string? VoucherUrl { get; set; }
    public string ActionStatus { get; set; } = "Pending";

    public ICollection<PackageBookedTraveler> TravelerDetails { get; set; } = new List<PackageBookedTraveler>();
}

public class PackageBookedTraveler : BaseEntity
{
    public Guid PackageBookingDetailId { get; set; }
    public PackageBookingDetail PackageBookingDetail { get; set; } = null!;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
}
