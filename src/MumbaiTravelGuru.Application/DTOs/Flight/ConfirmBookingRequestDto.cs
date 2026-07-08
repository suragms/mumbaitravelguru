namespace MumbaiTravelGuru.Application.DTOs.Flight;

public class ConfirmBookingRequestDto
{
    public string LockId { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string? PaymentTransactionId { get; set; }
}

public class ConfirmBookingResultDto
{
    public bool Succeeded { get; set; }
    public string? Error { get; set; }
    public string? BookingId { get; set; }
    public string? ConfirmationNumber { get; set; }
    public string? PnrNumber { get; set; }
    public string? TicketStatus { get; set; }
    public string? ETicketUrl { get; set; }
}
