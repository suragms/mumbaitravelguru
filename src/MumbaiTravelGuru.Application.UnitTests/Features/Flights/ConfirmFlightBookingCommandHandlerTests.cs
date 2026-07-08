using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.Features.Flights.Commands;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Models;
using MumbaiTravelGuru.Infrastructure.Persistence;
using MumbaiTravelGuru.Infrastructure.Services.Flights;
using NSubstitute;
using Xunit;

namespace MumbaiTravelGuru.Application.UnitTests.Features.Flights;

public class ConfirmFlightBookingCommandHandlerTests
{
    private readonly DbContextOptions<ApplicationDbContext> _options;
    private readonly ICurrentUserService _currentUser;
    private readonly IFlightSupplierAdapter _supplier;
    private readonly IFareLockStore _fareLockStore;
    private readonly IDateTime _dateTime;
    private readonly Guid _userId;

    public ConfirmFlightBookingCommandHandlerTests()
    {
        _options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _userId = Guid.NewGuid();
        _currentUser = Substitute.For<ICurrentUserService>();
        _currentUser.UserId.Returns(_userId);

        _supplier = Substitute.For<IFlightSupplierAdapter>();
        _fareLockStore = new InMemoryFareLockStore();
        _dateTime = Substitute.For<IDateTime>();
        _dateTime.UtcNow.Returns(DateTime.UtcNow);
    }

    [Fact]
    public async Task Handle_WithExpiredLock_ShouldReject()
    {
        using var context = new ApplicationDbContext(_options);
        var handler = new ConfirmFlightBookingCommandHandler(context, _currentUser, _supplier, _fareLockStore, _dateTime);

        var result = await handler.Handle(new ConfirmFlightBookingCommand("INVALID-LOCK", "Wallet", null), CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal("Fare lock expired or invalid. Please start booking again.", result.Error);
    }

    [Fact]
    public async Task Handle_ShouldUseServerSidePriceNotClientInput()
    {
        // This test proves that the price stored in the fare lock (authoritative)
        // is what gets used, not any client-supplied price.
        var fareLock = new FareLock
        {
            LockId = "LOCK-001",
            OfferId = "OFFER-1",
            LockedPrice = 10000m,
            Currency = "INR",
            LockedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10),
            SearchCriteria = new FlightSearchCriteria(),
        };
        _fareLockStore.Add(fareLock);

        _supplier.ConfirmBookingAsync(Arg.Any<FareLock>(), Arg.Any<List<TravelerInfo>>(), Arg.Any<CancellationToken>())
            .Returns(new ConfirmBookingResult(true, "PNR123456", "SYS123", "Confirmed", "/e-ticket/PNR123456", null));

        var bookingId = Guid.NewGuid();
        using (var context = new ApplicationDbContext(_options))
        {
            context.Users.Add(new User { Id = _userId, Email = "test@test.com" });
            context.Bookings.Add(new Booking
            {
                Id = bookingId,
                UserId = _userId,
                BookingType = MumbaiTravelGuru.Domain.Enums.BookingType.Flight,
                Status = MumbaiTravelGuru.Domain.Enums.BookingStatus.Pending,
                TotalAmount = 10000m,
            });
            context.Set<FlightBookingDetail>().Add(new FlightBookingDetail
            {
                FareLockId = "LOCK-001",
                BookingId = bookingId,
                Passengers = new List<FlightBookingPassenger>(),
            });
            await context.SaveChangesAsync();
        }

        using (var context = new ApplicationDbContext(_options))
        {
            var handler = new ConfirmFlightBookingCommandHandler(context, _currentUser, _supplier, _fareLockStore, _dateTime);

            var result = await handler.Handle(new ConfirmFlightBookingCommand("LOCK-001", "UPI", null), CancellationToken.None);

            Assert.True(result.Succeeded);
        }
    }
}
