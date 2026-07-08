using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MumbaiTravelGuru.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPackageEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FlightBookingDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    FareLockId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OfferId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TripType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CabinClass = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    OriginAirport = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    DestinationAirport = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    DepartureDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReturnDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Adults = table.Column<int>(type: "integer", nullable: false),
                    Children = table.Column<int>(type: "integer", nullable: false),
                    Infants = table.Column<int>(type: "integer", nullable: false),
                    PnrNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    TicketStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    ETicketUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ActionStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SupplierLocator = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SupplierRawResponse = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlightBookingDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlightBookingDetails_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GuestReviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    HotelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    HotelName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuestReviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GuestReviews_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GuestReviews_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HotelBookingDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    FareLockId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OfferId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    HotelId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    HotelName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    HotelAddress = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    StarRating = table.Column<int>(type: "integer", nullable: false),
                    CheckIn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CheckOut = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    NumberOfNights = table.Column<int>(type: "integer", nullable: false),
                    Rooms = table.Column<int>(type: "integer", nullable: false),
                    Adults = table.Column<int>(type: "integer", nullable: false),
                    Children = table.Column<int>(type: "integer", nullable: false),
                    BoardType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BookingReference = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    VoucherUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CancellationPolicy = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ActionStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HotelBookingDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HotelBookingDetails_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Packages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Overview = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Destination = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Theme = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DurationDays = table.Column<int>(type: "integer", nullable: false),
                    DurationNights = table.Column<int>(type: "integer", nullable: false),
                    PricePerPerson = table.Column<decimal>(type: "numeric", nullable: false),
                    DiscountedPricePerPerson = table.Column<decimal>(type: "numeric", nullable: true),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    PhotoUrls = table.Column<string[]>(type: "text[]", nullable: false),
                    Highlights = table.Column<string[]>(type: "text[]", nullable: false),
                    IsFixedDeparture = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Packages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FlightBookingPassengers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FlightBookingDetailId = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                    Gender = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    PassportNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Nationality = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TicketNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SeatNumber = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlightBookingPassengers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlightBookingPassengers_FlightBookingDetails_FlightBookingD~",
                        column: x => x.FlightBookingDetailId,
                        principalTable: "FlightBookingDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FlightBookingSegments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FlightBookingDetailId = table.Column<Guid>(type: "uuid", nullable: false),
                    DepartureAirportCode = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    ArrivalAirportCode = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    DepartureTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ArrivalTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Airline = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FlightNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Cabin = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlightBookingSegments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlightBookingSegments_FlightBookingDetails_FlightBookingDet~",
                        column: x => x.FlightBookingDetailId,
                        principalTable: "FlightBookingDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HotelBookedRooms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    HotelBookingDetailId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BoardType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    PricePerNight = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HotelBookedRooms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HotelBookedRooms_HotelBookingDetails_HotelBookingDetailId",
                        column: x => x.HotelBookingDetailId,
                        principalTable: "HotelBookingDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FixedDepartures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PackageId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PricePerPerson = table.Column<decimal>(type: "numeric", nullable: false),
                    DiscountedPricePerPerson = table.Column<decimal>(type: "numeric", nullable: true),
                    AvailableSpots = table.Column<int>(type: "integer", nullable: false),
                    TotalSpots = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FixedDepartures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FixedDepartures_Packages_PackageId",
                        column: x => x.PackageId,
                        principalTable: "Packages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PackageEnquiries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PackageId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Travelers = table.Column<int>(type: "integer", nullable: false),
                    PreferredStartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PreferredEndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Message = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackageEnquiries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PackageEnquiries_Packages_PackageId",
                        column: x => x.PackageId,
                        principalTable: "Packages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PackageEnquiries_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PackageExclusions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PackageId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackageExclusions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PackageExclusions_Packages_PackageId",
                        column: x => x.PackageId,
                        principalTable: "Packages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PackageInclusions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PackageId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackageInclusions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PackageInclusions_Packages_PackageId",
                        column: x => x.PackageId,
                        principalTable: "Packages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PackageItineraries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PackageId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayNumber = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Activities = table.Column<string[]>(type: "text[]", nullable: false),
                    Meals = table.Column<string[]>(type: "text[]", nullable: false),
                    Accommodation = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackageItineraries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PackageItineraries_Packages_PackageId",
                        column: x => x.PackageId,
                        principalTable: "Packages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PackageBookingDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    PackageId = table.Column<Guid>(type: "uuid", nullable: false),
                    FixedDepartureId = table.Column<Guid>(type: "uuid", nullable: true),
                    Travelers = table.Column<int>(type: "integer", nullable: false),
                    PricePerPerson = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "numeric", nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    BookingReference = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    VoucherUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ActionStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackageBookingDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PackageBookingDetails_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PackageBookingDetails_FixedDepartures_FixedDepartureId",
                        column: x => x.FixedDepartureId,
                        principalTable: "FixedDepartures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PackageBookingDetails_Packages_PackageId",
                        column: x => x.PackageId,
                        principalTable: "Packages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PackageBookedTravelers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PackageBookingDetailId = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                    Gender = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackageBookedTravelers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PackageBookedTravelers_PackageBookingDetails_PackageBooking~",
                        column: x => x.PackageBookingDetailId,
                        principalTable: "PackageBookingDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FixedDepartures_PackageId",
                table: "FixedDepartures",
                column: "PackageId");

            migrationBuilder.CreateIndex(
                name: "IX_FlightBookingDetails_BookingId",
                table: "FlightBookingDetails",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_FlightBookingPassengers_FlightBookingDetailId",
                table: "FlightBookingPassengers",
                column: "FlightBookingDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_FlightBookingSegments_FlightBookingDetailId",
                table: "FlightBookingSegments",
                column: "FlightBookingDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_GuestReviews_BookingId",
                table: "GuestReviews",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_GuestReviews_UserId",
                table: "GuestReviews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_HotelBookedRooms_HotelBookingDetailId",
                table: "HotelBookedRooms",
                column: "HotelBookingDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_HotelBookingDetails_BookingId",
                table: "HotelBookingDetails",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageBookedTravelers_PackageBookingDetailId",
                table: "PackageBookedTravelers",
                column: "PackageBookingDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageBookingDetails_BookingId",
                table: "PackageBookingDetails",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageBookingDetails_FixedDepartureId",
                table: "PackageBookingDetails",
                column: "FixedDepartureId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageBookingDetails_PackageId",
                table: "PackageBookingDetails",
                column: "PackageId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageEnquiries_PackageId",
                table: "PackageEnquiries",
                column: "PackageId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageEnquiries_UserId",
                table: "PackageEnquiries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageExclusions_PackageId",
                table: "PackageExclusions",
                column: "PackageId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageInclusions_PackageId",
                table: "PackageInclusions",
                column: "PackageId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageItineraries_PackageId",
                table: "PackageItineraries",
                column: "PackageId");

            migrationBuilder.CreateIndex(
                name: "IX_Packages_Slug",
                table: "Packages",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FlightBookingPassengers");

            migrationBuilder.DropTable(
                name: "FlightBookingSegments");

            migrationBuilder.DropTable(
                name: "GuestReviews");

            migrationBuilder.DropTable(
                name: "HotelBookedRooms");

            migrationBuilder.DropTable(
                name: "PackageBookedTravelers");

            migrationBuilder.DropTable(
                name: "PackageEnquiries");

            migrationBuilder.DropTable(
                name: "PackageExclusions");

            migrationBuilder.DropTable(
                name: "PackageInclusions");

            migrationBuilder.DropTable(
                name: "PackageItineraries");

            migrationBuilder.DropTable(
                name: "FlightBookingDetails");

            migrationBuilder.DropTable(
                name: "HotelBookingDetails");

            migrationBuilder.DropTable(
                name: "PackageBookingDetails");

            migrationBuilder.DropTable(
                name: "FixedDepartures");

            migrationBuilder.DropTable(
                name: "Packages");
        }
    }
}
