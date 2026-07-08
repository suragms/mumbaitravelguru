using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<SavedTraveler> SavedTravelers { get; }
    DbSet<Wallet> Wallets { get; }
    DbSet<WalletTransaction> WalletTransactions { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Refund> Refunds { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<Package> Packages { get; }
    DbSet<PackageEnquiry> PackageEnquiries { get; }
    DbSet<PackageBookingDetail> PackageBookingDetails { get; }
    DbSet<BusBookingDetail> BusBookingDetails { get; }
    DbSet<BusBookedSeat> BusBookedSeats { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<CouponUsage> CouponUsages { get; }
    DbSet<VendorAccount> VendorAccounts { get; }
    DbSet<VendorListing> VendorListings { get; }
    DbSet<VendorAvailabilityCalendar> VendorAvailabilityCalendars { get; }
    DbSet<VendorBooking> VendorBookings { get; }
    DbSet<VendorCommission> VendorCommissions { get; }
    DbSet<VendorPayout> VendorPayouts { get; }
    DbSet<VendorPayoutLineItem> VendorPayoutLineItems { get; }
    DbSet<BlogPost> BlogPosts { get; }
    DbSet<LandingPage> LandingPages { get; }

    DbSet<T> Set<T>() where T : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
