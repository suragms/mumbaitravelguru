namespace MumbaiTravelGuru.Domain.Enums;

public enum BookingType
{
    Flight,
    Hotel,
    Bus,
    Cab,
    Package
}

public enum BookingStatus
{
    Pending,
    Confirmed,
    Cancelled,
    Completed,
    Failed
}

public enum PaymentMethod
{
    CreditCard,
    DebitCard,
    UPI,
    NetBanking,
    Wallet,
    Cash
}

public enum PaymentStatus
{
    Pending,
    Processing,
    Completed,
    Failed,
    Refunded,
    PartiallyRefunded
}

public enum RefundStatus
{
    Pending,
    Approved,
    Processed,
    Failed
}

public enum WalletTransactionType
{
    Credit,
    Debit
}

public enum WalletTransactionStatus
{
    Pending,
    Success,
    Failed
}

public enum TripType
{
    OneWay,
    RoundTrip,
    MultiCity
}

public enum CabinClass
{
    Economy,
    PremiumEconomy,
    Business,
    First
}

public enum VendorBusinessType
{
    Hotel,
    Package,
    Cab
}

public enum VendorListingType
{
    Room,
    Package,
    CabType
}

public enum VendorPayoutStatus
{
    Pending,
    Processed,
    Failed
}

public enum DiscountType
{
    Percentage,
    Flat
}

public enum BookingActionStatus
{
    Pending,
    FareLocked,
    Confirmed,
    Failed,
    Expired
}
