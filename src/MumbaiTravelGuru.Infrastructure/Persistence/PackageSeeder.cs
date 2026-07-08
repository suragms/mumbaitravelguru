using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Infrastructure.Persistence;

public static class PackageSeeder
{
    private static DateTime UtcDate(int year, int month, int day) => new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc);

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        if (context.Packages.Any()) return;

        var packages = new List<Package>
        {
            new()
            {
                Id = Guid.Parse("a1000000-0000-0000-0000-000000000001"),
                Name = "Magical Goa Retreat",
                Slug = "magical-goa-retreat",
                Description = "Experience the best of Goa with pristine beaches, water sports, and vibrant nightlife.",
                Overview = "A perfect 4-day getaway to Goa covering North and South Goa attractions including beach hopping, water sports, spice plantation tour, and a sunset cruise.",
                Destination = "Goa",
                Theme = "Beach",
                DurationDays = 4,
                DurationNights = 3,
                PricePerPerson = 14999,
                DiscountedPricePerPerson = 12999,
                Currency = "INR",
                PhotoUrls = ["/images/packages/goa-1.jpg", "/images/packages/goa-2.jpg", "/images/packages/goa-3.jpg"],
                Highlights = ["Private beach resort stay", "Sunset cruise with dinner", "Water sports package", "Spice plantation tour"],
                IsFixedDeparture = true,
                IsActive = true,
                Itineraries = new List<PackageItinerary>
                {
                    new() { DayNumber = 1, Title = "Arrival & Beach Welcome", Description = "Arrive at Goa airport, transfer to resort. Evening at leisure on Baga Beach.", Activities = ["Airport pickup", "Check-in", "Beach walk", "Welcome dinner"], Meals = ["Dinner"], Accommodation = "Beach Resort, North Goa" },
                    new() { DayNumber = 2, Title = "North Goa Exploration", Description = "Visit Calangute, Anjuna, and Vagator beaches. Optional water sports at Candolim.", Activities = ["Beach hopping", "Water sports", "Shopping at Anjuna Flea Market", "Sunset at Vagator"], Meals = ["Breakfast", "Lunch"], Accommodation = "Beach Resort, North Goa" },
                    new() { DayNumber = 3, Title = "South Goa & Sunset Cruise", Description = "Explore South Goa beaches, visit Old Goa churches, evening sunset cruise.", Activities = ["South Goa tour", "Old Goa churches visit", "Spice plantation", "Sunset cruise with dinner"], Meals = ["Breakfast", "Dinner"], Accommodation = "Beach Resort, North Goa" },
                    new() { DayNumber = 4, Title = "Departure", Description = "Breakfast at resort, checkout, transfer to airport.", Activities = ["Breakfast", "Checkout", "Airport drop"], Meals = ["Breakfast"] },
                },
                Inclusions = new List<PackageInclusion>
                {
                    new() { Description = "3 nights accommodation at beach resort", SortOrder = 1 },
                    new() { Description = "Daily breakfast", SortOrder = 2 },
                    new() { Description = "Airport transfers", SortOrder = 3 },
                    new() { Description = "Sunset cruise with dinner", SortOrder = 4 },
                    new() { Description = "Water sports (1 activity)", SortOrder = 5 },
                    new() { Description = "All taxes included", SortOrder = 6 },
                },
                Exclusions = new List<PackageExclusion>
                {
                    new() { Description = "Airfare", SortOrder = 1 },
                    new() { Description = "Personal expenses", SortOrder = 2 },
                    new() { Description = "Travel insurance", SortOrder = 3 },
                    new() { Description = "Extra meals not mentioned", SortOrder = 4 },
                },
                FixedDepartures = new List<FixedDeparture>
                {
                    new() { StartDate = UtcDate(2026, 10, 5), EndDate = UtcDate(2026, 10, 8), PricePerPerson = 14999, DiscountedPricePerPerson = 12999, AvailableSpots = 15, TotalSpots = 20 },
                    new() { StartDate = UtcDate(2026, 10, 19), EndDate = UtcDate(2026, 10, 22), PricePerPerson = 14999, DiscountedPricePerPerson = 12999, AvailableSpots = 12, TotalSpots = 20 },
                    new() { StartDate = UtcDate(2026, 11, 10), EndDate = UtcDate(2026, 11, 13), PricePerPerson = 15999, DiscountedPricePerPerson = 13999, AvailableSpots = 18, TotalSpots = 20 },
                },
            },
            new()
            {
                Id = Guid.Parse("a1000000-0000-0000-0000-000000000002"),
                Name = "Kerala Backwaters & Munnar",
                Slug = "kerala-backwaters-munnar",
                Description = "Explore God's Own Country with houseboat stay, tea gardens, and hill station romance.",
                Overview = "A 6-day journey through Kerala covering Munnar's tea plantations, Thekkady's wildlife, Alleppey's backwaters, and Kumarakom's houseboat experience.",
                Destination = "Kerala",
                Theme = "Nature",
                DurationDays = 6,
                DurationNights = 5,
                PricePerPerson = 24999,
                DiscountedPricePerPerson = 21999,
                Currency = "INR",
                PhotoUrls = ["/images/packages/kerala-1.jpg", "/images/packages/kerala-2.jpg", "/images/packages/kerala-3.jpg"],
                Highlights = ["Houseboat stay in Alleppey", "Tea plantation tour in Munnar", "Wildlife safari in Thekkady", "Kerala Ayurvedic massage"],
                IsFixedDeparture = true,
                IsActive = true,
                Itineraries = new List<PackageItinerary>
                {
                    new() { DayNumber = 1, Title = "Arrival in Kochi & Munnar Transfer", Description = "Arrive at Kochi airport, drive to Munnar (4 hours). Evening at leisure.", Activities = ["Airport pickup", "Scenic drive to Munnar", "Check-in", "Evening walk"], Meals = ["Dinner"], Accommodation = "Hill Resort, Munnar" },
                    new() { DayNumber = 2, Title = "Munnar Tea Gardens", Description = "Full day exploring Munnar's tea plantations, Eravikulam National Park, and Mattupetty Dam.", Activities = ["Tea plantation visit", "Eravikulam National Park", "Mattupetty Dam", "Tea tasting"], Meals = ["Breakfast", "Lunch", "Dinner"], Accommodation = "Hill Resort, Munnar" },
                    new() { DayNumber = 3, Title = "Munnar to Thekkady", Description = "Drive to Thekkady. Afternoon boating at Periyar Lake and wildlife spotting.", Activities = ["Drive to Thekkady", "Periyar Lake boating", "Wildlife safari", "Spice market visit"], Meals = ["Breakfast", "Dinner"], Accommodation = "Wildlife Resort, Thekkady" },
                    new() { DayNumber = 4, Title = "Thekkady to Alleppey", Description = "Drive to Alleppey. Board deluxe houseboat for backwater cruise.", Activities = ["Drive to Alleppey", "Houseboat check-in", "Backwater cruise", "Sunset views", "Live Kerala dinner on boat"], Meals = ["Breakfast", "Lunch", "Dinner"], Accommodation = "Deluxe Houseboat, Alleppey" },
                    new() { DayNumber = 5, Title = "Alleppey & Kumarakom", Description = "Disembark from houseboat, visit Kumarakom bird sanctuary, optional Ayurvedic massage.", Activities = ["Houseboat disembark", "Kumarakom Bird Sanctuary", "Ayurvedic massage", "Sunset at Vembanad Lake"], Meals = ["Breakfast", "Dinner"], Accommodation = "Lake Resort, Kumarakom" },
                    new() { DayNumber = 6, Title = "Departure", Description = "Breakfast, checkout, transfer to Kochi airport.", Activities = ["Breakfast", "Checkout", "Airport drop"], Meals = ["Breakfast"] },
                },
                Inclusions = new List<PackageInclusion>
                {
                    new() { Description = "5 nights accommodation", SortOrder = 1 },
                    new() { Description = "Daily breakfast & dinner", SortOrder = 2 },
                    new() { Description = "1-night deluxe houseboat with all meals", SortOrder = 3 },
                    new() { Description = "Airport transfers", SortOrder = 4 },
                    new() { Description = "Tea plantation tour", SortOrder = 5 },
                    new() { Description = "Periyar Lake boating", SortOrder = 6 },
                    new() { Description = "All taxes", SortOrder = 7 },
                },
                Exclusions = new List<PackageExclusion>
                {
                    new() { Description = "Airfare", SortOrder = 1 },
                    new() { Description = "Personal expenses", SortOrder = 2 },
                    new() { Description = "Travel insurance", SortOrder = 3 },
                    new() { Description = "Camera fees at monuments", SortOrder = 4 },
                    new() { Description = "Lunch on days 1, 4 & 5", SortOrder = 5 },
                },
                FixedDepartures = new List<FixedDeparture>
                {
                    new() { StartDate = UtcDate(2026, 9, 12), EndDate = UtcDate(2026, 9, 17), PricePerPerson = 24999, DiscountedPricePerPerson = 21999, AvailableSpots = 10, TotalSpots = 15 },
                    new() { StartDate = UtcDate(2026, 10, 10), EndDate = UtcDate(2026, 10, 15), PricePerPerson = 24999, DiscountedPricePerPerson = 21999, AvailableSpots = 8, TotalSpots = 15 },
                    new() { StartDate = UtcDate(2026, 11, 7), EndDate = UtcDate(2026, 11, 12), PricePerPerson = 26999, DiscountedPricePerPerson = 23999, AvailableSpots = 14, TotalSpots = 15 },
                },
            },
            new()
            {
                Id = Guid.Parse("a1000000-0000-0000-0000-000000000003"),
                Name = "Rajasthan Royal Odyssey",
                Slug = "rajasthan-royal-odyssey",
                Description = "A regal journey through Rajasthan's forts, palaces, and deserts.",
                Overview = "An 8-day royal circuit covering Jaipur, Jodhpur, Udaipur, and Jaisalmer with camel safaris, palace visits, and cultural performances.",
                Destination = "Rajasthan",
                Theme = "Heritage",
                DurationDays = 8,
                DurationNights = 7,
                PricePerPerson = 34999,
                DiscountedPricePerPerson = 29999,
                Currency = "INR",
                PhotoUrls = ["/images/packages/rajasthan-1.jpg", "/images/packages/rajasthan-2.jpg", "/images/packages/rajasthan-3.jpg"],
                Highlights = ["Heritage haveli stays", "Camel safari in Jaisalmer", "Sunset at Mehrangarh Fort", "Lake Pichola boat ride"],
                IsFixedDeparture = true,
                IsActive = true,
                Itineraries = new List<PackageItinerary>
                {
                    new() { DayNumber = 1, Title = "Arrival in Jaipur", Description = "Arrive at Jaipur airport, transfer to heritage hotel. Evening welcome with traditional Rajasthani dinner.", Activities = ["Airport pickup", "Check-in", "Traditional welcome", "Rajasthani dinner"], Meals = ["Dinner"], Accommodation = "Heritage Hotel, Jaipur" },
                    new() { DayNumber = 2, Title = "Jaipur Sightseeing", Description = "Visit Amber Fort, Hawa Mahal, City Palace, and Jantar Mantar.", Activities = ["Amber Fort with elephant ride", "Hawa Mahal", "City Palace", "Jantar Mantar", "Shopping at Johari Bazaar"], Meals = ["Breakfast", "Lunch"], Accommodation = "Heritage Hotel, Jaipur" },
                    new() { DayNumber = 3, Title = "Jaipur to Jodhpur", Description = "Drive to Jodhpur (5 hours). Visit Mehrangarh Fort and Jaswant Thada.", Activities = ["Drive to Jodhpur", "Mehrangarh Fort", "Jaswant Thada", "Clock Tower market"], Meals = ["Breakfast", "Dinner"], Accommodation = "Heritage Haveli, Jodhpur" },
                    new() { DayNumber = 4, Title = "Jodhpur to Udaipur", Description = "Drive to Udaipur via Ranakpur Jain Temple.", Activities = ["Drive via Ranakpur", "Ranakpur Temple visit", "Arrive in Udaipur", "Lake Pichola sunset boat ride"], Meals = ["Breakfast", "Dinner"], Accommodation = "Lake Resort, Udaipur" },
                    new() { DayNumber = 5, Title = "Udaipur City Tour", Description = "Visit City Palace, Sahelion-ki-Bari, and local crafts.", Activities = ["City Palace", "Sahelion-ki-Bari", "Craft village visit", "Cultural show"], Meals = ["Breakfast", "Lunch"], Accommodation = "Lake Resort, Udaipur" },
                    new() { DayNumber = 6, Title = "Udaipur to Jaisalmer", Description = "Drive to Jaisalmer (7 hours). Evening at leisure.", Activities = ["Long drive through Thar Desert", "Check-in", "Evening walk"], Meals = ["Breakfast", "Dinner"], Accommodation = "Desert Camp, Jaisalmer" },
                    new() { DayNumber = 7, Title = "Jaisalmer & Desert Safari", Description = "Visit Jaisalmer Fort, Patwon ki Haveli. Afternoon camel safari and desert camp stay.", Activities = ["Jaisalmer Fort", "Patwon ki Haveli", "Camel safari", "Desert sunset", "Cultural program with dinner"], Meals = ["Breakfast", "Dinner"], Accommodation = "Desert Camp, Jaisalmer" },
                    new() { DayNumber = 8, Title = "Departure", Description = "Breakfast, transfer to Jaisalmer airport.", Activities = ["Breakfast", "Airport drop"], Meals = ["Breakfast"] },
                },
                Inclusions = new List<PackageInclusion>
                {
                    new() { Description = "7 nights accommodation", SortOrder = 1 },
                    new() { Description = "Daily breakfast & dinner", SortOrder = 2 },
                    new() { Description = "Airport transfers", SortOrder = 3 },
                    new() { Description = "Camel safari in Jaisalmer", SortOrder = 4 },
                    new() { Description = "Lake Pichola boat ride", SortOrder = 5 },
                    new() { Description = "Cultural show in Udaipur", SortOrder = 6 },
                    new() { Description = "All monument entry fees", SortOrder = 7 },
                },
                Exclusions = new List<PackageExclusion>
                {
                    new() { Description = "Airfare", SortOrder = 1 },
                    new() { Description = "Personal expenses", SortOrder = 2 },
                    new() { Description = "Travel insurance", SortOrder = 3 },
                    new() { Description = "Tips & gratuities", SortOrder = 4 },
                    new() { Description = "Lunches (except day 2 & 5)", SortOrder = 5 },
                },
                FixedDepartures = new List<FixedDeparture>
                {
                    new() { StartDate = UtcDate(2026, 10, 3), EndDate = UtcDate(2026, 10, 10), PricePerPerson = 34999, DiscountedPricePerPerson = 29999, AvailableSpots = 12, TotalSpots = 16 },
                    new() { StartDate = UtcDate(2026, 11, 7), EndDate = UtcDate(2026, 11, 14), PricePerPerson = 34999, DiscountedPricePerPerson = 29999, AvailableSpots = 10, TotalSpots = 16 },
                    new() { StartDate = UtcDate(2026, 12, 5), EndDate = UtcDate(2026, 12, 12), PricePerPerson = 39999, DiscountedPricePerPerson = 34999, AvailableSpots = 8, TotalSpots = 16 },
                },
            },
            new()
            {
                Id = Guid.Parse("a1000000-0000-0000-0000-000000000004"),
                Name = "Himachal Himalayan Trails",
                Slug = "himachal-himalayan-trails",
                Description = "Trek through the pristine Himalayan valleys of Himachal Pradesh.",
                Overview = "A 7-day adventure covering Shimla, Manali, and Dharamshala with river rafting, paragliding, and Himalayan treks for the adventurous soul.",
                Destination = "Himachal",
                Theme = "Adventure",
                DurationDays = 7,
                DurationNights = 6,
                PricePerPerson = 19999,
                Currency = "INR",
                PhotoUrls = ["/images/packages/himachal-1.jpg", "/images/packages/himachal-2.jpg", "/images/packages/himachal-3.jpg"],
                Highlights = ["Paragliding in Bir Billing", "River rafting in Kullu", "Trek to Triund", "Shimla toy train ride"],
                IsFixedDeparture = false,
                IsActive = true,
                Itineraries = new List<PackageItinerary>
                {
                    new() { DayNumber = 1, Title = "Arrival in Shimla", Description = "Arrive at Chandigarh, drive to Shimla. Evening Mall Road walk.", Activities = ["Airport pickup", "Drive to Shimla", "Check-in", "Mall Road walk"], Meals = ["Dinner"], Accommodation = "Hotel, Shimla" },
                    new() { DayNumber = 2, Title = "Shimla & Kufri", Description = "Visit Kufri, Jakhoo Temple, and The Ridge.", Activities = ["Kufri excursion", "Jakhoo Temple", "The Ridge", "Toy train ride (optional)"], Meals = ["Breakfast", "Dinner"], Accommodation = "Hotel, Shimla" },
                    new() { DayNumber = 3, Title = "Shimla to Manali", Description = "Scenic drive to Manali (6 hours) via Kullu valley.", Activities = ["Scenic drive", "River crossing at Pandoh Dam", "Arrive in Manali"], Meals = ["Breakfast", "Dinner"], Accommodation = "Mountain Resort, Manali" },
                    new() { DayNumber = 4, Title = "Manali Exploration", Description = "Visit Solang Valley, Hadimba Temple, and Old Manali.", Activities = ["Solang Valley activities", "Hadimba Temple", "Old Manali walk", "River rafting (seasonal)"], Meals = ["Breakfast", "Dinner"], Accommodation = "Mountain Resort, Manali" },
                    new() { DayNumber = 5, Title = "Manali to Dharamshala", Description = "Drive to Dharamshala. Visit Bhagsunath Temple and waterfall.", Activities = ["Drive to Dharamshala", "Bhagsunath Temple", "Waterfall trek", "McLeodganj market"], Meals = ["Breakfast", "Dinner"], Accommodation = "Hotel, Dharamshala" },
                    new() { DayNumber = 6, Title = "Triund Trek", Description = "Day trek to Triund with panoramic Himalayan views.", Activities = ["Triund trek (6 km)", "Panoramic mountain views", "Picnic lunch", "Return trek"], Meals = ["Breakfast", "Lunch", "Dinner"], Accommodation = "Hotel, Dharamshala" },
                    new() { DayNumber = 7, Title = "Departure", Description = "Breakfast, transfer to Gaggal airport or Pathankot.", Activities = ["Breakfast", "Airport drop"], Meals = ["Breakfast"] },
                },
                Inclusions = new List<PackageInclusion>
                {
                    new() { Description = "6 nights accommodation", SortOrder = 1 },
                    new() { Description = "Daily breakfast & dinner", SortOrder = 2 },
                    new() { Description = "Airport transfers", SortOrder = 3 },
                    new() { Description = "Triund trek guide", SortOrder = 4 },
                    new() { Description = "River rafting (seasonal)", SortOrder = 5 },
                    new() { Description = "All taxes", SortOrder = 6 },
                },
                Exclusions = new List<PackageExclusion>
                {
                    new() { Description = "Airfare", SortOrder = 1 },
                    new() { Description = "Paragliding charges (extra)", SortOrder = 2 },
                    new() { Description = "Personal expenses", SortOrder = 3 },
                    new() { Description = "Travel insurance", SortOrder = 4 },
                    new() { Description = "Lunches (except day 6)", SortOrder = 5 },
                },
            },
        };

        context.Packages.AddRange(packages);
        await context.SaveChangesAsync();
    }
}
