using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Infrastructure.Persistence;

namespace MumbaiTravelGuru.Infrastructure.Services;

public class ReconciliationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<ReconciliationBackgroundService> _logger;

    public ReconciliationBackgroundService(IServiceProvider services, ILogger<ReconciliationBackgroundService> logger)
    {
        _services = services; _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Reconciliation background service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                await ScanForReconciliation(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in reconciliation scan.");
            }
        }
    }

    private async Task ScanForReconciliation(CancellationToken cancellationToken)
    {
        using var scope = _services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var flaggedBookings = await context.Bookings
            .Include(b => b.Payments)
            .Include(b => b.User)
            .Where(b => b.NeedsReconciliation && !b.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var booking in flaggedBookings)
        {
            _logger.LogWarning(
                "Booking {BookingId} (User: {UserId}, Type: {Type}, Amount: {Amount}) flagged for reconciliation. " +
                "Payment captured but supplier confirmation failed. Manual Ops review required.",
                booking.Id, booking.UserId, booking.BookingType, booking.PaidAmount);

            context.AuditLogs.Add(new AuditLog
            {
                Action = "ReconciliationScan",
                UserId = booking.UserId,
                Details = $"Reconciliation scan flagged booking {booking.Id}. Payment:{booking.PaidAmount} Status:{booking.Status} Ops review needed.",
            });
        }

        if (flaggedBookings.Count > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
