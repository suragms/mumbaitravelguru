using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Infrastructure.Services.Hotels;

public class MockHotelSupplierAdapter : IHotelSupplierAdapter
{
    private static readonly Random _rng = new();

    private static readonly List<(string Name, string Desc, int Stars, double Rating, string City, string Country, string Address, double Lat, double Lon, List<string> Amenities, List<string> Policies)> Hotels = new()
    {
        ("The Taj Mahal Palace", "Iconic 5-star luxury hotel overlooking the Gateway of India with heritage architecture.", 5, 4.8, "Mumbai", "India", "Apollo Bunder, Mumbai", 18.9219, 72.8336,
            new List<string>{"Pool","Spa","Restaurant","Gym","Concierge","Room Service","Business Center","Free WiFi","Valet Parking","Airport Shuttle"},
            new List<string>{"Check-in: 14:00","Check-out: 12:00","Cancellation: Free 48h before","Children: Welcome","Pets: Not allowed"}),
        ("The Oberoi Mumbai", "Luxury hotel with stunning sea views and world-class dining.", 5, 4.7, "Mumbai", "India", "Nariman Point, Mumbai", 18.9256, 72.8225,
            new List<string>{"Pool","Spa","Gym","Restaurant","Bar","Room Service","Free WiFi","Business Center","Butler Service"},
            new List<string>{"Check-in: 14:00","Check-out: 12:00","Cancellation: Free 24h before","Breakfast included"}),
        ("JW Marriott Mumbai", "Premium business hotel in Juhu with modern amenities.", 5, 4.5, "Mumbai", "India", "Juhu Tara Road, Mumbai", 19.1075, 72.8263,
            new List<string>{"Pool","Spa","Gym","Restaurant","Bar","Free WiFi","Parking","Kids Club","Conference Rooms"},
            new List<string>{"Check-in: 15:00","Check-out: 12:00","Cancellation: Free 24h before","Extra bed charges apply"}),
        ("ITC Grand Central Mumbai", "Luxury hotel in Parel with eco-friendly design.", 5, 4.4, "Mumbai", "India", "Parel, Mumbai", 18.9947, 72.8413,
            new List<string>{"Pool","Spa","Gym","Restaurant","Free WiFi","Parking","Butler Service","Organic Toiletries"},
            new List<string>{"Check-in: 14:00","Check-out: 12:00","Non-smoking property","Eco-friendly policy"}),
        ("The Leela Mumbai", "Elegant hotel near the airport with award-winning service.", 5, 4.6, "Mumbai", "India", "Sahar, Mumbai", 19.0893, 72.8681,
            new List<string>{"Pool","Spa","Gym","Restaurant","Bar","Free WiFi","Parking","Airport Shuttle","Concierge"},
            new List<string>{"Check-in: 14:00","Check-out: 12:00","Free cancellation 48h","Airport transfer available"}),
        ("The Lalit Mumbai", "Modern business hotel in central Mumbai.", 4, 4.2, "Mumbai", "India", "Andheri East, Mumbai", 19.1146, 72.8709,
            new List<string>{"Pool","Gym","Restaurant","Bar","Free WiFi","Parking","Business Center","Laundry"},
            new List<string>{"Check-in: 14:00","Check-out: 12:00","Cancellation: 24h notice"}),
        ("Hilton Mumbai International Airport", "Convenient airport hotel with modern comfort.", 4, 4.3, "Mumbai", "India", "Sahar Airport Road, Mumbai", 19.1016, 72.8658,
            new List<string>{"Pool","Gym","Restaurant","Bar","Free WiFi","Airport Shuttle","Business Center","24h Room Service"},
            new List<string>{"Check-in: 14:00","Check-out: 12:00","Free cancellation 24h","Soundproof rooms"}),
        ("Hotel Marine Plaza", "Boutique hotel on Marine Drive with sea views.", 3, 4.1, "Mumbai", "India", "Marine Drive, Mumbai", 18.9425, 72.8230,
            new List<string>{"Restaurant","Free WiFi","Room Service","Laundry","Parking","Beach Access"},
            new List<string>{"Check-in: 13:00","Check-out: 11:00"}),
        ("Hotel Residency Mumbai", "Budget-friendly option in South Mumbai.", 3, 3.8, "Mumbai", "India", "Fort, Mumbai", 18.9322, 72.8344,
            new List<string>{"Free WiFi","Restaurant","Room Service","Laundry","Travel Desk"},
            new List<string>{"Check-in: 12:00","Check-out: 11:00"}),
        ("FabExpress Grand Inn", "Value hotel with essential amenities.", 3, 3.5, "Mumbai", "India", "Vile Parle, Mumbai", 19.1005, 72.8485,
            new List<string>{"Free WiFi","Restaurant","Room Service","Laundry"},
            new List<string>{"Check-in: 12:00","Check-out: 11:00"}),
        // Delhi hotels
        ("The Imperial New Delhi", "Historic 5-star hotel in central Delhi.", 5, 4.7, "Delhi", "India", "Janpath, New Delhi", 28.6219, 77.2219,
            new List<string>{"Pool","Spa","Gym","Restaurant","Bar","Free WiFi","Parking","Concierge","Heritage Tour"},
            new List<string>{"Check-in: 14:00","Check-out: 12:00","Free cancellation 48h"}),
        ("The Leela Palace New Delhi", "Opulent palace-style hotel in the Diplomatic Enclave.", 5, 4.8, "Delhi", "India", "Chanakyapuri, New Delhi", 28.5929, 77.1655,
            new List<string>{"Pool","Spa","Gym","Restaurant","Bar","Free WiFi","Parking","Butler Service","Chauffeur-driven Cars"},
            new List<string>{"Check-in: 14:00","Check-out: 12:00","Free cancellation 24h","Formal dress code in restaurants"}),
        ("Taj Diplomatic Enclave", "Luxury hotel near Delhi airport.", 5, 4.5, "Delhi", "India", "Aerocity, New Delhi", 28.5497, 77.1211,
            new List<string>{"Pool","Spa","Gym","Restaurant","Bar","Free WiFi","Parking","Airport Shuttle","24h Room Service"},
            new List<string>{"Check-in: 14:00","Check-out: 12:00","Free cancellation 48h"}),
        // Goa hotels
        ("Taj Fort Aguada Resort & Spa", "Beachfront luxury resort in North Goa.", 5, 4.6, "Goa", "India", "Sinquerim, North Goa", 15.5020, 73.7689,
            new List<string>{"Pool","Spa","Gym","Restaurant","Bar","Free WiFi","Beach Access","Water Sports","Kids Club","Tennis Court"},
            new List<string>{"Check-in: 14:00","Check-out: 11:00","All-inclusive available","No outside food"}),
        ("W Goa", "Trendy beachfront resort with vibrant nightlife.", 5, 4.4, "Goa", "India", "Vagator, North Goa", 15.5975, 73.7442,
            new List<string>{"Pool","Spa","Gym","Restaurant","Bar","Free WiFi","Beach Club","Live Music","Water Sports"},
            new List<string>{"Check-in: 15:00","Check-out: 12:00","Adults-only pool","Minimum stay 2 nights"}),
        // Bangalore hotels
        ("The Ritz-Carlton Bangalore", "Luxury hotel in the heart of Bangalore.", 5, 4.6, "Bengaluru", "India", "Residency Road, Bengaluru", 12.9706, 77.5979,
            new List<string>{"Pool","Spa","Gym","Restaurant","Bar","Free WiFi","Parking","Concierge","Kids Club"},
            new List<string>{"Check-in: 14:00","Check-out: 12:00","Free cancellation 24h"}),
        ("Sheraton Grand Bangalore", "Premium business hotel at Brigade Gateway.", 5, 4.3, "Bengaluru", "India", "Rajajinagar, Bengaluru", 12.9937, 77.5549,
            new List<string>{"Pool","Spa","Gym","Restaurant","Bar","Free WiFi","Parking","Shopping Mall Access"},
            new List<string>{"Check-in: 14:00","Check-out: 12:00","Free cancellation 48h"}),
    };

    public Task<List<HotelOffer>> SearchHotelsAsync(HotelSearchCriteria criteria, CancellationToken cancellationToken = default)
    {
        var nights = (criteria.CheckOut - criteria.CheckIn).Days;
        if (nights <= 0) nights = 1;

        var matches = Hotels
            .Where(h => h.City.Contains(criteria.City, StringComparison.OrdinalIgnoreCase) || criteria.City.Contains(h.City, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (!matches.Any())
            matches = Hotels.Where(h => h.City.Contains("Mumbai", StringComparison.OrdinalIgnoreCase)).Take(5).ToList();

        if (criteria.MinStarRating.HasValue)
            matches = matches.Where(h => h.Stars >= criteria.MinStarRating.Value).ToList();

        var results = matches.Select(h =>
        {
            var rooms = GenerateRooms(h.Stars, nights, criteria.Adults);
            var minPrice = rooms.Any() ? rooms.Min(r => r.TotalPrice) : 5000;

            return new HotelOffer
            {
                HotelId = $"HTL-{h.Name[..3].ToUpper()}-{_rng.Next(100,999)}",
                Name = h.Name,
                Description = h.Desc,
                City = h.City,
                Country = h.Country,
                Address = h.Address,
                Latitude = h.Lat,
                Longitude = h.Lon,
                StarRating = h.Stars,
                GuestRating = h.Rating,
                ReviewCount = _rng.Next(50, 2000),
                PhotoUrls = Enumerable.Range(1, 6).Select(i => $"/images/hotels/{h.Name.Replace(" ","").ToLower()}-{i}.jpg").ToList(),
                Amenities = h.Amenities,
                Policies = h.Policies,
                Rooms = rooms,
                TotalPrice = minPrice,
                Currency = "INR",
                PriceExpiryUtc = DateTime.UtcNow.AddMinutes(_rng.Next(10, 20)),
                SeatsAvailable = _rng.Next(3, 20),
            };
        }).OrderBy(h => h.TotalPrice).ToList();

        if (criteria.MaxPricePerNight.HasValue)
            results = results.Where(h => h.Rooms.Any(r => r.PricePerNight <= criteria.MaxPricePerNight.Value)).ToList();

        return Task.FromResult(results);
    }

    public Task<HotelOffer?> GetHotelDetailAsync(string hotelId, CancellationToken cancellationToken = default)
    {
        var hotel = Hotels.FirstOrDefault(h => $"HTL-{h.Name[..3].ToUpper()}-XXX".Replace("XXX", "") == hotelId[..^3]);
        if (hotel == default)
        {
            var idx = _rng.Next(Hotels.Count);
            hotel = Hotels[idx];
        }
        var nights = _rng.Next(1, 5);
        var rooms = GenerateRooms(hotel.Stars, nights, 2);
        return Task.FromResult<HotelOffer?>(new HotelOffer
        {
            HotelId = hotelId,
            Name = hotel.Name,
            Description = hotel.Desc,
            City = hotel.City,
            Country = hotel.Country,
            Address = hotel.Address,
            Latitude = hotel.Lat,
            Longitude = hotel.Lon,
            StarRating = hotel.Stars,
            GuestRating = hotel.Rating,
            ReviewCount = _rng.Next(50, 2000),
            PhotoUrls = Enumerable.Range(1, 6).Select(i => $"/images/hotels/{hotel.Name.Replace(" ","").ToLower()}-{i}.jpg").ToList(),
            Amenities = hotel.Amenities,
            Policies = hotel.Policies,
            Rooms = rooms,
            TotalPrice = rooms.Any() ? rooms.Min(r => r.TotalPrice) : 5000,
            Currency = "INR",
            PriceExpiryUtc = DateTime.UtcNow.AddMinutes(15),
            SeatsAvailable = _rng.Next(3, 20),
        });
    }

    public Task<HotelOffer?> GetOfferByIdAsync(string offerId, CancellationToken cancellationToken = default)
    {
        return GetHotelDetailAsync(offerId, cancellationToken);
    }

    public Task<FareLock?> LockRateAsync(string offerId, string roomId, HotelSearchCriteria criteria, CancellationToken cancellationToken = default)
    {
        var price = _rng.Next(3000, 25000);
        var fareLock = new FareLock
        {
            OfferId = offerId,
            SupplierId = "MOCK-HOTEL",
            LockedPrice = price,
            Currency = "INR",
            SearchCriteria = new FlightSearchCriteria(),
            LockedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10),
        };
        return Task.FromResult<FareLock?>(fareLock);
    }

    public Task<ConfirmBookingResult> ConfirmBookingAsync(FareLock fareLock, List<TravelerInfo> travelers, CancellationToken cancellationToken = default)
    {
        var refNo = $"HTL-{_rng.Next(1000000, 9999999)}";
        var result = new ConfirmBookingResult(true, refNo, "SYS" + _rng.Next(10000, 99999), "Confirmed", $"/api/v1/bookings/hotel/voucher/{refNo}", null);
        return Task.FromResult(result);
    }

    private static List<HotelRoomOffer> GenerateRooms(int stars, int nights, int adults)
    {
        var rooms = new List<HotelRoomOffer>();
        var basePrice = stars switch { 5 => _rng.Next(8000, 25000), 4 => _rng.Next(4000, 12000), _ => _rng.Next(1500, 5000) };

        rooms.Add(new HotelRoomOffer
        {
            RoomType = "Deluxe Room",
            Description = "Well-appointed room with modern amenities and city view.",
            MaxAdults = 2, MaxChildren = 1,
            TotalRoomsAvailable = _rng.Next(2, 10),
            PricePerNight = basePrice,
            TotalPrice = basePrice * nights,
            BoardType = "Room Only",
            IsRefundable = true,
            CancellationPolicy = "Free cancellation up to 24 hours before check-in",
            RoomAmenities = new List<string>{"Air Conditioning","Flat-screen TV","Mini Bar","Tea/Coffee Maker","Safe","Free WiFi","Housekeeping"},
        });

        rooms.Add(new HotelRoomOffer
        {
            RoomType = "Executive Suite",
            Description = "Spacious suite with separate living area and premium amenities.",
            MaxAdults = 3, MaxChildren = 2,
            TotalRoomsAvailable = _rng.Next(1, 5),
            PricePerNight = (int)(basePrice * 1.8),
            TotalPrice = (int)(basePrice * 1.8 * nights),
            BoardType = "Breakfast Included",
            IsRefundable = true,
            CancellationPolicy = "Free cancellation up to 48 hours before check-in",
            RoomAmenities = new List<string>{"Air Conditioning","Flat-screen TV","Mini Bar","Tea/Coffee Maker","Safe","Free WiFi","Living Area","Work Desk","Bathrobe","Slippers"},
        });

        if (stars >= 4)
        {
            rooms.Add(new HotelRoomOffer
            {
                RoomType = "Premium Suite",
                Description = "Top-tier suite with panoramic views, butler service, and exclusive lounge access.",
                MaxAdults = 4, MaxChildren = 3,
                TotalRoomsAvailable = _rng.Next(1, 3),
                PricePerNight = (int)(basePrice * 3.2),
                TotalPrice = (int)(basePrice * 3.2 * nights),
                BoardType = "Half Board",
                IsRefundable = false,
                CancellationPolicy = "Non-refundable. Full payment required at booking.",
                RoomAmenities = new List<string>{"Air Conditioning","Flat-screen TV","Mini Bar","Tea/Coffee Maker","Safe","Free WiFi","Living Room","Dining Area","Butler Service","Lounge Access","Jacuzzi","Walk-in Closet"},
            });
        }

        if (stars <= 3)
        {
            rooms.Add(new HotelRoomOffer
            {
                RoomType = "Standard Room",
                Description = "Comfortable room with essential amenities at a great value.",
                MaxAdults = 2, MaxChildren = 1,
                TotalRoomsAvailable = _rng.Next(5, 20),
                PricePerNight = (int)(basePrice * 0.65),
                TotalPrice = (int)(basePrice * 0.65 * nights),
                BoardType = "Room Only",
                IsRefundable = true,
                CancellationPolicy = "Free cancellation up to 24 hours before check-in",
                RoomAmenities = new List<string>{"Air Conditioning","Flat-screen TV","Free WiFi","Housekeeping","Attached Bathroom"},
            });
        }

        return rooms;
    }
}
