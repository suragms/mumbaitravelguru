using MumbaiTravelGuru.Application.DTOs.Flight;

namespace MumbaiTravelGuru.Application.DTOs.Package;

public class PackageListItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
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
}

public class PackageDetailDto
{
    public Guid Id { get; set; }
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
    public List<PackageItineraryDto> Itineraries { get; set; } = new();
    public List<PackageInclusionDto> Inclusions { get; set; } = new();
    public List<PackageExclusionDto> Exclusions { get; set; } = new();
    public List<FixedDepartureDto> FixedDepartures { get; set; } = new();
    public PriceBreakupDto PriceBreakup { get; set; } = new();
}

public class PackageItineraryDto
{
    public int DayNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string[] Activities { get; set; } = [];
    public string[] Meals { get; set; } = [];
    public string? Accommodation { get; set; }
}

public class PackageInclusionDto
{
    public string Description { get; set; } = string.Empty;
}

public class PackageExclusionDto
{
    public string Description { get; set; } = string.Empty;
}

public class FixedDepartureDto
{
    public Guid Id { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal PricePerPerson { get; set; }
    public decimal? DiscountedPricePerPerson { get; set; }
    public int AvailableSpots { get; set; }
    public int TotalSpots { get; set; }
    public bool IsActive { get; set; }
}

public class PriceBreakupDto
{
    public decimal BasePricePerPerson { get; set; }
    public decimal DiscountPerPerson { get; set; }
    public decimal TaxPercentage { get; set; } = 5;
    public decimal TaxAmount { get; set; }
    public decimal TotalPerPerson { get; set; }
}

public class PackageEnquiryRequestDto
{
    public Guid? PackageId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int Travelers { get; set; } = 1;
    public DateTime? PreferredStartDate { get; set; }
    public DateTime? PreferredEndDate { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class PackageEnquiryResultDto
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public Guid? EnquiryId { get; set; }
}

public class InitiatePackageBookingRequestDto
{
    public Guid PackageId { get; set; }
    public Guid? FixedDepartureId { get; set; }
    public int Travelers { get; set; } = 1;
    public List<TravelerDetailDto> TravelerDetails { get; set; } = new();
}

public class InitiatePackageBookingResultDto
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public Guid? BookingId { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal InitialPayment { get; set; }
    public string Currency { get; set; } = "INR";
}

public class ConfirmPackageBookingRequestDto
{
    public Guid BookingId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? PaymentTransactionId { get; set; }
    public bool IsFinalPayment { get; set; }
}

public class ConfirmPackageBookingResultDto
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public string? ConfirmationNumber { get; set; }
    public string? BookingReference { get; set; }
    public string? VoucherUrl { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal TotalPrice { get; set; }
    public bool IsFullyPaid { get; set; }
}
