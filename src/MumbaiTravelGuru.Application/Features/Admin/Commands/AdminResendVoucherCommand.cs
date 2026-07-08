using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Behaviours;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;

namespace MumbaiTravelGuru.Application.Features.Admin.Commands;

[AdminAction("AdminResendVoucher", "Admin resent voucher for booking", EntityType = "Booking", EntityIdProperty = "BookingId", LogRequest = true)]
public record AdminResendVoucherCommand(Guid BookingId) : IRequest<AdminResendVoucherResult>;

public class AdminResendVoucherResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public string? VoucherUrl { get; set; }
    public string? BookingType { get; set; }
}

public class AdminResendVoucherCommandValidator : AbstractValidator<AdminResendVoucherCommand>
{
    public AdminResendVoucherCommandValidator() => RuleFor(v => v.BookingId).NotEmpty();
}

public class AdminResendVoucherCommandHandler : IRequestHandler<AdminResendVoucherCommand, AdminResendVoucherResult>
{
    private readonly IApplicationDbContext _context;

    public AdminResendVoucherCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<AdminResendVoucherResult> Handle(AdminResendVoucherCommand request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && !b.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Booking not found.");

        if (booking.Status != BookingStatus.Confirmed)
            return new AdminResendVoucherResult { Succeeded = false, Error = "Booking is not confirmed." };

        string? voucherUrl = null;

        if (booking.BookingType == BookingType.Flight)
        {
            var detail = await _context.Set<FlightBookingDetail>()
                .FirstOrDefaultAsync(d => d.BookingId == booking.Id, cancellationToken);
            voucherUrl = detail?.ETicketUrl;
        }
        else if (booking.BookingType == BookingType.Hotel)
        {
            var detail = await _context.Set<HotelBookingDetail>()
                .FirstOrDefaultAsync(d => d.BookingId == booking.Id, cancellationToken);
            voucherUrl = detail?.VoucherUrl;
        }
        else if (booking.BookingType == BookingType.Package)
        {
            var detail = await _context.Set<PackageBookingDetail>()
                .FirstOrDefaultAsync(d => d.BookingId == booking.Id, cancellationToken);
            voucherUrl = detail?.VoucherUrl;
        }

        return new AdminResendVoucherResult
        {
            Succeeded = true,
            VoucherUrl = voucherUrl ?? $"/api/v1/bookings/{booking.BookingType.ToString().ToLower()}/voucher/{booking.ConfirmationNumber}",
            BookingType = booking.BookingType.ToString(),
        };
    }
}
