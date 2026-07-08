using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Infrastructure.Services.Buses;

public class MockBusSupplierAdapter : IBusSupplierAdapter
{
    private static readonly Random _rng = new();

    private static readonly string[] Operators =
    {
        "Neeta Travels", "SRS Travels", "VRL Travels", "KSRTC",
        "Orange Travels", "SeaBird Travels", "Paulo Travels", "Kallada Travels",
        "IntrCity SmartBus", "National Travels", "Raj Express", "CityLink",
    };

    private static readonly string[] BusTypes =
    {
        "AC Sleeper (2+1)", "AC Sleeper (1+1)", "Non-AC Seater (2+2)",
        "AC Seater (2+2)", "AC Semi-Sleeper (2+2)", "Volvo AC Multi-Axle Sleeper",
        "AC Sleeper (1+1) Premium", "Non-AC Sleeper (2+1)",
    };

    private static readonly string[] AmenitiesPool =
    {
        "Charging Point", "Reading Light", "Blanket", "Water Bottle",
        "Emergency Exit", "CCTV", "GPS Tracking", "Pillow",
        "Snacks", "Live Tracking", "Hand Sanitizer", "Mask",
    };

    private static readonly Dictionary<string, string[]> CityRoutes = new()
    {
        ["Mumbai"] = ["Pune", "Goa", "Ahmedabad", "Surat", "Nashik", "Aurangabad", "Shirdi", "Kolhapur"],
        ["Pune"] = ["Mumbai", "Bengaluru", "Hyderabad", "Nagpur", "Solapur", "Kolhapur"],
        ["Bengaluru"] = ["Chennai", "Hyderabad", "Mumbai", "Pune", "Mysuru", "Mangalore", "Kochi"],
        ["Delhi"] = ["Jaipur", "Agra", "Chandigarh", "Dehradun", "Manali", "Shimla", "Haridwar", "Lucknow"],
        ["Chennai"] = ["Bengaluru", "Hyderabad", "Coimbatore", "Madurai", "Pondicherry", "Tirupati"],
        ["Hyderabad"] = ["Bengaluru", "Chennai", "Mumbai", "Nagpur", "Vijayawada", "Warangal"],
        ["Goa"] = ["Mumbai", "Pune", "Bengaluru", "Hubli"],
        ["Jaipur"] = ["Delhi", "Jodhpur", "Udaipur", "Ajmer", "Bikaner"],
        ["Ahmedabad"] = ["Mumbai", "Surat", "Vadodara", "Rajkot", "Udaipur"],
        ["Kochi"] = ["Bengaluru", "Trivandrum", "Calicut", "Coimbatore"],
    };

    private static readonly Dictionary<string, (string[] Names, string[] Addresses)> CityBoardingPoints = new()
    {
        ["Mumbai"] = (["Dadar TT Circle", "Borivali National Park", "Andheri SV Road", "Sion Circle", "Kurla Bus Stand", "Thane Station"],
                      ["Opp. Dadar Station", "Near National Park Gate", "SV Road Junction", "Sion Circle Bus Stop", "Kurla Depot", "Thane Railway Station"]),
        ["Pune"] = (["Shivaji Nagar", "Swargate", "Hinjewadi", "Wakad", "Viman Nagar"],
                    ["Shivaji Nagar Bus Stand", "Swargate Bus Depot", "Phase 3 Hinjewadi", "Wakad Chowk", "Viman Nagar Road"]),
        ["Bengaluru"] = (["Majestic", "Yeshwanthpur", "Electronic City", "KR Puram", "Whitefield"],
                         ["KBS Majestic Bus Stand", "Yeshwanthpur Circle", "Electronic City Gate", "KR Puram Railway Station", "Whitefield Main Road"]),
        ["Delhi"] = (["ISBT Kashmere Gate", "Anand Vihar", "Sarai Kale Khan", "Majnu Ka Tilla", "Dhaula Kuan"],
                     ["ISBT Kashmere Gate", "Anand Vihar Bus Terminal", "Sarai Kale Khan ISBT", "Majnu Ka Tilla Bus Stop", "Dhaula Kuan Bus Stop"]),
    };

    private static (string[] names, string[] addresses) GetBoardingPoints(string city)
    {
        if (CityBoardingPoints.TryGetValue(city, out var points)) return points;
        return (["City Center", "Main Bus Stand", "Railway Station"], ["City Center Bus Stop", "Main Bus Stand", "Railway Station Bus Stop"]);
    }

    public Task<List<BusTrip>> SearchBusesAsync(BusSearchCriteria criteria, CancellationToken cancellationToken = default)
    {
        var results = new List<BusTrip>();
        var tripCount = _rng.Next(6, 14);

        var originBoarding = GetBoardingPoints(criteria.Origin);
        var destDropping = GetBoardingPoints(criteria.Destination);

        for (int i = 0; i < tripCount; i++)
        {
            var operatorName = Operators[_rng.Next(Operators.Length)];
            var busType = BusTypes[_rng.Next(BusTypes.Length)];
            var basePrice = busType.Contains("Sleeper") ? _rng.Next(450, 1800) : _rng.Next(250, 900);
            if (busType.Contains("Volvo")) basePrice += _rng.Next(300, 800);
            if (busType.Contains("Premium")) basePrice += _rng.Next(200, 500);

            var depHour = _rng.Next(6, 23);
            var depMin = _rng.Next(0, 59) / 5 * 5;
            var durationMin = _rng.Next(180, 720);
            var depTime = criteria.TravelDate.Date.AddHours(depHour).AddMinutes(depMin);
            var arrTime = depTime.AddMinutes(durationMin);
            var totalSeats = busType.Contains("1+1") ? _rng.Next(12, 20) : busType.Contains("2+2") ? _rng.Next(28, 44) : _rng.Next(20, 36);

            var amenities = AmenitiesPool.OrderBy(_ => _rng.Next()).Take(_rng.Next(3, 7)).ToList();

            var boardingPoints = originBoarding.names.Select((n, idx) => new BusBoardingPoint
            {
                PointId = $"BP-{operatorName[..2].ToUpper()}-{idx:D2}",
                Name = n,
                Address = originBoarding.addresses[idx],
                Landmark = $"Landmark {idx + 1}",
                Time = depTime.AddMinutes(-_rng.Next(15, 60) * (idx + 1)),
            }).Take(_rng.Next(2, 4)).ToList();

            var droppingPoints = destDropping.names.Select((n, idx) => new BusDroppingPoint
            {
                PointId = $"DP-{operatorName[..2].ToUpper()}-{idx:D2}",
                Name = n,
                Address = destDropping.addresses[idx],
                Landmark = $"Landmark {idx + 1}",
                Time = arrTime.AddMinutes(_rng.Next(0, 30) * (idx + 1)),
            }).Take(_rng.Next(2, 4)).ToList();

            results.Add(new BusTrip
            {
                TripId = $"BUS-{operatorName[..3].ToUpper()}-{criteria.Origin[..3].ToUpper()}-{_rng.Next(100, 999)}",
                OperatorName = operatorName,
                BusType = busType,
                Origin = criteria.Origin,
                Destination = criteria.Destination,
                DepartureTime = depTime,
                ArrivalTime = arrTime,
                DurationMinutes = durationMin,
                PricePerSeat = basePrice,
                DiscountedPricePerSeat = _rng.Next(0, 3) > 0 ? basePrice - _rng.Next(30, basePrice / 5) : null,
                Currency = "INR",
                AvailableSeats = _rng.Next(2, totalSeats),
                TotalSeats = totalSeats,
                Rating = Math.Round(3.0 + _rng.NextDouble() * 2.0, 1),
                ReviewCount = _rng.Next(50, 5000),
                Amenities = amenities,
                CancellationPolicy = _rng.Next(0, 10) > 3
                    ? "Free cancellation up to 4 hours before departure"
                    : "Free cancellation up to 24 hours before departure (Rs 50 cancellation fee after)",
                BoardingPoints = boardingPoints,
                DroppingPoints = droppingPoints,
            });
        }

        return Task.FromResult(results.OrderBy(t => t.DepartureTime).ToList());
    }

    public Task<BusTrip?> GetTripDetailAsync(string tripId, CancellationToken cancellationToken = default)
    {
        var random = new Random();
        var baseTrip = new BusTrip
        {
            TripId = tripId,
            OperatorName = Operators[_rng.Next(Operators.Length)],
            BusType = BusTypes[_rng.Next(BusTypes.Length)],
            Origin = "Mumbai",
            Destination = "Pune",
            DepartureTime = DateTime.UtcNow.AddHours(4),
            ArrivalTime = DateTime.UtcNow.AddHours(8),
            DurationMinutes = 240,
            PricePerSeat = 599,
            Currency = "INR",
            AvailableSeats = _rng.Next(5, 25),
            TotalSeats = 36,
            Rating = 4.2,
            ReviewCount = _rng.Next(100, 3000),
            Amenities = AmenitiesPool.OrderBy(_ => _rng.Next()).Take(5).ToList(),
        };

        var bpNames = new[] { "Dadar TT", "Sion Circle", "Kurla Depot" };
        var bpAddresses = new[] { "Opp. Dadar Station", "Sion Circle Bus Stop", "Kurla Bus Depot" };
        baseTrip.BoardingPoints = bpNames.Select((n, i) => new BusBoardingPoint
        {
            PointId = $"BP-{i:D2}", Name = n, Address = bpAddresses[i],
            Landmark = $"Landmark {i + 1}",
            Time = baseTrip.DepartureTime.AddMinutes(-30 * (i + 1)),
        }).ToList();

        var dpNames = new[] { "Shivaji Nagar", "Swargate", "Katraj" };
        var dpAddresses = new[] { "Shivaji Nagar Bus Stand", "Swargate Bus Depot", "Katraj Chowk" };
        baseTrip.DroppingPoints = dpNames.Select((n, i) => new BusDroppingPoint
        {
            PointId = $"DP-{i:D2}", Name = n, Address = dpAddresses[i],
            Landmark = $"Landmark {i + 1}",
            Time = baseTrip.ArrivalTime.AddMinutes(15 * i),
        }).ToList();

        return Task.FromResult<BusTrip?>(baseTrip);
    }

    public Task<BusSeatLayout?> GetSeatLayoutAsync(string tripId, CancellationToken cancellationToken = default)
    {
        var isSleeper = tripId.Contains("SLP");
        var seats = new List<BusSeat>();

        if (isSleeper)
        {
            var totalBerths = _rng.Next(24, 36);
            var bookedCount = _rng.Next(8, totalBerths - 3);
            var bookedSet = new HashSet<int>(Enumerable.Range(0, totalBerths).OrderBy(_ => _rng.Next()).Take(bookedCount));

            for (int i = 0; i < totalBerths; i++)
            {
                var deck = i < totalBerths / 2 ? "Lower" : "Upper";
                var berthNum = (i % (totalBerths / 2)) + 1;
                var side = i % 4 < 2 ? "Aisle" : "Window";
                seats.Add(new BusSeat
                {
                    SeatId = $"{deck[0]}{berthNum:D2}",
                    Row = berthNum,
                    Column = i % 3,
                    Label = $"{deck[0]}{berthNum}",
                    Deck = deck,
                    Type = "Sleeper",
                    IsBooked = bookedSet.Contains(i),
                    IsBlocked = !bookedSet.Contains(i) && _rng.Next(0, 15) == 0,
                    Price = _rng.Next(500, 1200),
                    IsWindow = side == "Window",
                    IsAisle = side == "Aisle",
                });
            }

            return Task.FromResult<BusSeatLayout?>(new BusSeatLayout
            {
                TripId = tripId,
                DeckType = "Sleeper",
                TotalRows = totalBerths / 2,
                ColumnConfig = "2+1",
                Seats = seats,
            });
        }
        else
        {
            var totalSeats = _rng.Next(28, 44);
            var cols = 4;
            var rows = totalSeats / cols;
            var bookedCount = _rng.Next(8, totalSeats - 4);
            var bookedSet = new HashSet<int>(Enumerable.Range(0, totalSeats).OrderBy(_ => _rng.Next()).Take(bookedCount));

            for (int r = 0; r < rows; r++)
            {
                for (int c = 0; c < cols; c++)
                {
                    var idx = r * cols + c;
                    if (idx >= totalSeats) break;
                    var label = $"{Convert.ToChar(65 + r)}{c + 1}";
                    seats.Add(new BusSeat
                    {
                        SeatId = label,
                        Row = r,
                        Column = c,
                        Label = label,
                        Deck = "Lower",
                        Type = "Seater",
                        IsBooked = bookedSet.Contains(idx),
                        IsBlocked = !bookedSet.Contains(idx) && _rng.Next(0, 20) == 0,
                        Price = _rng.Next(250, 800),
                        IsWindow = c == 0 || c == cols - 1,
                        IsAisle = c == 1 || c == cols - 2,
                    });
                }
            }

            return Task.FromResult<BusSeatLayout?>(new BusSeatLayout
            {
                TripId = tripId,
                DeckType = "Seater",
                TotalRows = rows,
                ColumnConfig = "2+2",
                Seats = seats,
            });
        }
    }

    public Task<FareLock?> LockSeatsAsync(string tripId, List<string> seatIds, CancellationToken cancellationToken = default)
    {
        var price = seatIds.Count * _rng.Next(400, 1200);
        return Task.FromResult<FareLock?>(new FareLock
        {
            OfferId = tripId,
            SupplierId = "MOCK-BUS",
            LockedPrice = price,
            Currency = "INR",
            LockedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10),
        });
    }

    public Task<ConfirmBookingResult> ConfirmBookingAsync(FareLock fareLock, List<string> seatIds, CancellationToken cancellationToken = default)
    {
        var refNo = $"BUS-{_rng.Next(1000000, 9999999)}";
        return Task.FromResult(new ConfirmBookingResult(true, refNo, "SYS" + _rng.Next(10000, 99999), "Confirmed", $"/tickets/bus/{refNo}", null));
    }
}
