using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;
using MumbaiTravelGuru.Domain.Enums;
using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Application.Features.Payments.Commands;

public record CreatePaymentOrderResult
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public string? GatewayOrderId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? GatewayKeyId { get; set; }
    public Guid? BookingId { get; set; }
}

public record CreatePaymentOrderCommand(Guid BookingId, string? CouponCode = null) : IRequest<CreatePaymentOrderResult>;

public class CreatePaymentOrderCommandValidator : AbstractValidator<CreatePaymentOrderCommand>
{
    public CreatePaymentOrderCommandValidator() => RuleFor(v => v.BookingId).NotEmpty();
}

public class CreatePaymentOrderCommandHandler : IRequestHandler<CreatePaymentOrderCommand, CreatePaymentOrderResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IPaymentGateway _gateway;

    public CreatePaymentOrderCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser, IPaymentGateway gateway)
    {
        _context = context; _currentUser = currentUser; _gateway = gateway;
    }

    public async Task<CreatePaymentOrderResult> Handle(CreatePaymentOrderCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException("User not authenticated.");

        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException("Booking not found.");

        if (booking.Status != BookingStatus.Pending)
            return new CreatePaymentOrderResult { Succeeded = false, Error = "Booking is not in a payable state." };

        var amount = booking.TotalAmount - booking.PaidAmount;
        if (amount <= 0)
            return new CreatePaymentOrderResult { Succeeded = false, Error = "Booking is already fully paid." };

        var user = await _context.Users.FirstAsync(u => u.Id == userId, cancellationToken);

        if (!string.IsNullOrEmpty(request.CouponCode))
        {
            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code == request.CouponCode && !c.IsDeleted, cancellationToken);
            if (coupon?.IsActive == true && amount >= coupon.MinBookingValue)
            {
                var discount = coupon.Type == DiscountType.Percentage
                    ? amount * coupon.Value / 100
                    : coupon.Value;
                if (coupon.MaxDiscountAmount.HasValue && discount > coupon.MaxDiscountAmount.Value)
                    discount = coupon.MaxDiscountAmount.Value;
                if (discount > amount) discount = amount;

                if (discount > 0)
                {
                    amount -= discount;
                    coupon.CurrentUsageCount++;
                    _context.CouponUsages.Add(new CouponUsage
                    {
                        CouponId = coupon.Id,
                        UserId = userId,
                        BookingId = booking.Id,
                        DiscountedAmount = discount,
                        Currency = booking.Currency,
                        UsedAt = DateTime.UtcNow,
                    });
                }
            }
        }

        var gateayRequest = new CreateOrderRequest
        {
            BookingId = booking.Id,
            Amount = amount,
            Currency = booking.Currency,
            Receipt = $"booking_{booking.Id:N}"[..40],
        };

        var gateayResponse = await _gateway.CreateOrderAsync(gateayRequest, cancellationToken);

        if (!gateayResponse.Succeeded)
            return new CreatePaymentOrderResult { Succeeded = false, Error = gateayResponse.Error };

        var payment = new Payment
        {
            BookingId = booking.Id,
            UserId = userId,
            Method = PaymentMethod.CreditCard,
            Status = PaymentStatus.Pending,
            Amount = amount,
            Currency = booking.Currency,
            GatewayOrderId = gateayResponse.GatewayOrderId,
        };
        _context.Payments.Add(payment);

        await _context.SaveChangesAsync(cancellationToken);

        return new CreatePaymentOrderResult
        {
            Succeeded = true,
            GatewayOrderId = gateayResponse.GatewayOrderId,
            Amount = amount,
            Currency = booking.Currency,
            GatewayKeyId = gateayResponse.GatewayKeyId,
            BookingId = booking.Id,
        };
    }
}
