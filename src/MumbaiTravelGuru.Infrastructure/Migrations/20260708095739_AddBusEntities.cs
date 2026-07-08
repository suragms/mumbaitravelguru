using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MumbaiTravelGuru.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBusEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BusBookingDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    FareLockId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TripId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OperatorName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    BusType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Origin = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Destination = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DepartureTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ArrivalTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    BoardingPointId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BoardingPointName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DroppingPointId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DroppingPointName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SeatCount = table.Column<int>(type: "integer", nullable: false),
                    PricePerSeat = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    BookingReference = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TicketUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ActionStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusBookingDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusBookingDetails_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BusBookedSeats",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusBookingDetailId = table.Column<Guid>(type: "uuid", nullable: false),
                    SeatLabel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Deck = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Row = table.Column<int>(type: "integer", nullable: false),
                    Col = table.Column<int>(type: "integer", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    PassengerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Age = table.Column<int>(type: "integer", nullable: true),
                    Gender = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusBookedSeats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusBookedSeats_BusBookingDetails_BusBookingDetailId",
                        column: x => x.BusBookingDetailId,
                        principalTable: "BusBookingDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusBookedSeats_BusBookingDetailId",
                table: "BusBookedSeats",
                column: "BusBookingDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_BusBookingDetails_BookingId",
                table: "BusBookingDetails",
                column: "BookingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusBookedSeats");

            migrationBuilder.DropTable(
                name: "BusBookingDetails");
        }
    }
}
