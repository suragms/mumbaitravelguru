using System.Reflection;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<SavedTraveler> SavedTravelers => Set<SavedTraveler>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Refund> Refunds => Set<Refund>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Package> Packages => Set<Package>();
    public DbSet<PackageEnquiry> PackageEnquiries => Set<PackageEnquiry>();
    public DbSet<PackageBookingDetail> PackageBookingDetails => Set<PackageBookingDetail>();
    public DbSet<BusBookingDetail> BusBookingDetails => Set<BusBookingDetail>();
    public DbSet<BusBookedSeat> BusBookedSeats => Set<BusBookedSeat>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<CouponUsage> CouponUsages => Set<CouponUsage>();
    public DbSet<VendorAccount> VendorAccounts => Set<VendorAccount>();
    public DbSet<VendorListing> VendorListings => Set<VendorListing>();
    public DbSet<VendorAvailabilityCalendar> VendorAvailabilityCalendars => Set<VendorAvailabilityCalendar>();
    public DbSet<VendorBooking> VendorBookings => Set<VendorBooking>();
    public DbSet<VendorCommission> VendorCommissions => Set<VendorCommission>();
    public DbSet<VendorPayout> VendorPayouts => Set<VendorPayout>();
    public DbSet<VendorPayoutLineItem> VendorPayoutLineItems => Set<VendorPayoutLineItem>();
    public DbSet<BlogPost> BlogPosts => Set<BlogPost>();
    public DbSet<LandingPage> LandingPages => Set<LandingPage>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<Domain.Common.BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
