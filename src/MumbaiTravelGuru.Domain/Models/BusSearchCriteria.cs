namespace MumbaiTravelGuru.Domain.Models;

public class BusSearchCriteria
{
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime TravelDate { get; set; }
}

public class BusTrip
{
    public string TripId { get; set; } = Guid.NewGuid().ToString("N")[..12];
    public string OperatorName { get; set; } = string.Empty;
    public string BusType { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime DepartureTime { get; set; }
    public DateTime ArrivalTime { get; set; }
    public int DurationMinutes { get; set; }
    public decimal PricePerSeat { get; set; }
    public decimal? DiscountedPricePerSeat { get; set; }
    public string Currency { get; set; } = "INR";
    public int AvailableSeats { get; set; }
    public int TotalSeats { get; set; }
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public List<string> Amenities { get; set; } = new();
    public string CancellationPolicy { get; set; } = string.Empty;
    public List<BusBoardingPoint> BoardingPoints { get; set; } = new();
    public List<BusDroppingPoint> DroppingPoints { get; set; } = new();
}

public class BusBoardingPoint
{
    public string PointId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Landmark { get; set; } = string.Empty;
    public DateTime Time { get; set; }
}

public class BusDroppingPoint
{
    public string PointId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Landmark { get; set; } = string.Empty;
    public DateTime Time { get; set; }
}

public class BusSeatLayout
{
    public string TripId { get; set; } = string.Empty;
    public string DeckType { get; set; } = "Seater";
    public int TotalRows { get; set; }
    public string ColumnConfig { get; set; } = string.Empty;
    public List<BusSeat> Seats { get; set; } = new();
}

public class BusSeat
{
    public string SeatId { get; set; } = string.Empty;
    public int Row { get; set; }
    public int Column { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Deck { get; set; } = "Lower";
    public string Type { get; set; } = "Seater";
    public bool IsBooked { get; set; }
    public bool IsBlocked { get; set; }
    public decimal Price { get; set; }
    public bool IsWindow { get; set; }
    public bool IsAisle { get; set; }
}
