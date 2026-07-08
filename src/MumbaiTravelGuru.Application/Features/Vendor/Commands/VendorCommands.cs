using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Vendor;

namespace MumbaiTravelGuru.Application.Features.Vendor.Commands;

public record UpdateVendorProfileCommand(
    string? BusinessName, string? ContactEmail,
    string? ContactPhone, string? Address, string? GSTIN) : IRequest<UpdateVendorProfileResult>;

public class UpdateVendorProfileResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
}

public class UpdateVendorProfileCommandHandler : IRequestHandler<UpdateVendorProfileCommand, UpdateVendorProfileResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateVendorProfileCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<UpdateVendorProfileResult> Handle(UpdateVendorProfileCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var vendor = await _context.VendorAccounts
            .FirstOrDefaultAsync(v => v.UserId == userId && !v.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Vendor account not found.");

        if (request.BusinessName != null) vendor.BusinessName = request.BusinessName;
        if (request.ContactEmail != null) vendor.ContactEmail = request.ContactEmail;
        if (request.ContactPhone != null) vendor.ContactPhone = request.ContactPhone;
        if (request.Address != null) vendor.Address = request.Address;
        if (request.GSTIN != null) vendor.GSTIN = request.GSTIN;

        await _context.SaveChangesAsync(cancellationToken);
        return new UpdateVendorProfileResult { Succeeded = true };
    }
}

public record UpdateVendorListingCommand(
    Guid ListingId, string? Title, string? Description,
    decimal? DefaultPrice, bool? IsActive) : IRequest<UpdateVendorListingResult>;

public class UpdateVendorListingResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
}

public class UpdateVendorListingCommandHandler : IRequestHandler<UpdateVendorListingCommand, UpdateVendorListingResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateVendorListingCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<UpdateVendorListingResult> Handle(UpdateVendorListingCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var listing = await _context.VendorListings
            .Include(l => l.VendorAccount)
            .FirstOrDefaultAsync(l => l.Id == request.ListingId && l.VendorAccount.UserId == userId && !l.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Listing not found.");

        if (request.Title != null) listing.Title = request.Title;
        if (request.Description != null) listing.Description = request.Description;
        if (request.DefaultPrice.HasValue) listing.DefaultPrice = request.DefaultPrice;
        if (request.IsActive.HasValue) listing.IsActive = request.IsActive.Value;

        await _context.SaveChangesAsync(cancellationToken);
        return new UpdateVendorListingResult { Succeeded = true };
    }
}

public record UpdateAvailabilityCommand(
    Guid ListingId, List<UpdateAvailabilityRequestDto> Entries) : IRequest<UpdateAvailabilityResult>;

public class UpdateAvailabilityResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public int Updated { get; set; }
}

public class UpdateAvailabilityCommandHandler : IRequestHandler<UpdateAvailabilityCommand, UpdateAvailabilityResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public UpdateAvailabilityCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<UpdateAvailabilityResult> Handle(UpdateAvailabilityCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();
        var listing = await _context.VendorListings
            .Include(l => l.VendorAccount)
            .FirstOrDefaultAsync(l => l.Id == request.ListingId && l.VendorAccount.UserId == userId && !l.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Listing not found.");

        var updated = 0;
        foreach (var entry in request.Entries)
        {
            var existing = await _context.VendorAvailabilityCalendars
                .FirstOrDefaultAsync(c => c.VendorListingId == request.ListingId && c.Date == entry.Date && !c.IsDeleted, cancellationToken);

            if (existing is not null)
            {
                existing.IsAvailable = entry.IsAvailable;
                existing.AvailableUnits = entry.AvailableUnits;
                existing.PriceOverride = entry.PriceOverride;
                existing.Notes = entry.Notes;
            }
            else
            {
                _context.VendorAvailabilityCalendars.Add(new Domain.Entities.VendorAvailabilityCalendar
                {
                    VendorListingId = request.ListingId,
                    Date = entry.Date,
                    IsAvailable = entry.IsAvailable,
                    AvailableUnits = entry.AvailableUnits,
                    PriceOverride = entry.PriceOverride,
                    Notes = entry.Notes,
                });
            }
            updated++;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return new UpdateAvailabilityResult { Succeeded = true, Updated = updated };
    }
}
