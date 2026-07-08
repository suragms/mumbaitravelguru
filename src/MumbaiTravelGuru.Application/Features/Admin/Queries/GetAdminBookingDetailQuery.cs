using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;

namespace MumbaiTravelGuru.Application.Features.Admin.Queries;

public record GetAdminBookingDetailQuery(Guid Id) : IRequest<AdminBookingDetailDto>;

public class GetAdminBookingDetailQueryHandler : IRequestHandler<GetAdminBookingDetailQuery, AdminBookingDetailDto>
{
    private readonly IApplicationDbContext _context;

    public GetAdminBookingDetailQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<AdminBookingDetailDto> Handle(GetAdminBookingDetailQuery request, CancellationToken cancellationToken)
    {
        var booking = await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Payments)
                .ThenInclude(p => p.Refunds)
            .FirstOrDefaultAsync(b => b.Id == request.Id && !b.IsDeleted, cancellationToken)
            ?? throw new InvalidOperationException("Booking not found.");

        return new AdminBookingDetailDto
        {
            Id = booking.Id,
            UserId = booking.UserId,
            UserEmail = booking.User.Email,
            UserName = $"{booking.User.FirstName} {booking.User.LastName}",
            BookingType = booking.BookingType.ToString(),
            Status = booking.Status.ToString(),
            TotalAmount = booking.TotalAmount,
            PaidAmount = booking.PaidAmount,
            Currency = booking.Currency,
            ConfirmationNumber = booking.ConfirmationNumber,
            CancellationReason = booking.CancellationReason,
            CancelledAt = booking.CancelledAt,
            CompletedAt = booking.CompletedAt,
            CreatedAt = booking.CreatedAt,
            NeedsReconciliation = booking.NeedsReconciliation,
            Payments = booking.Payments.Where(p => !p.IsDeleted).Select(p => new AdminPaymentDto
            {
                Id = p.Id, Method = p.Method.ToString(), Status = p.Status.ToString(),
                Amount = p.Amount, Currency = p.Currency,
                GatewayOrderId = p.GatewayOrderId, GatewayTransactionId = p.GatewayTransactionId,
                ProcessedAt = p.ProcessedAt,
            }).ToList(),
            Refunds = booking.Payments
                .Where(p => !p.IsDeleted)
                .SelectMany(p => p.Refunds.Where(r => !r.IsDeleted))
                .Select(r => new AdminRefundDto
                {
                    Id = r.Id, Amount = r.Amount, Status = r.Status.ToString(),
                    GatewayRefundId = r.GatewayRefundId, ProcessedAt = r.ProcessedAt,
                }).ToList(),
        };
    }
}
