using FluentValidation;
using MediatR;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Application.DTOs.Hotel;

namespace MumbaiTravelGuru.Application.Features.Hotels.Queries;

public record GetHotelDetailQuery(string HotelId) : IRequest<HotelOfferDto>;

public class GetHotelDetailQueryValidator : AbstractValidator<GetHotelDetailQuery>
{
    public GetHotelDetailQueryValidator() => RuleFor(v => v.HotelId).NotEmpty();
}

public class GetHotelDetailQueryHandler : IRequestHandler<GetHotelDetailQuery, HotelOfferDto>
{
    private readonly IHotelSupplierAdapter _supplier;

    public GetHotelDetailQueryHandler(IHotelSupplierAdapter supplier) => _supplier = supplier;

    public async Task<HotelOfferDto> Handle(GetHotelDetailQuery request, CancellationToken cancellationToken)
    {
        var offer = await _supplier.GetHotelDetailAsync(request.HotelId, cancellationToken)
            ?? throw new InvalidOperationException("Hotel not found.");

        return SearchHotelsQueryHandler.MapOffer(offer);
    }
}
