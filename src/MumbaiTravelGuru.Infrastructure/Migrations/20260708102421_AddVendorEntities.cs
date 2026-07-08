using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MumbaiTravelGuru.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVendorEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VendorAccounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    BusinessType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ContactEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ContactPhone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    GSTIN = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsOnboarded = table.Column<bool>(type: "boolean", nullable: false),
                    CommissionRate = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorAccounts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VendorCommissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VendorAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CommissionRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    EffectiveFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorCommissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorCommissions_VendorAccounts_VendorAccountId",
                        column: x => x.VendorAccountId,
                        principalTable: "VendorAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VendorListings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VendorAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    ListingType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    DefaultPrice = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorListings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorListings_VendorAccounts_VendorAccountId",
                        column: x => x.VendorAccountId,
                        principalTable: "VendorAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VendorPayouts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VendorAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CommissionAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    NetAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TransactionReference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorPayouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorPayouts_VendorAccounts_VendorAccountId",
                        column: x => x.VendorAccountId,
                        principalTable: "VendorAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VendorAvailabilityCalendars",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VendorListingId = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    AvailableUnits = table.Column<int>(type: "integer", nullable: true),
                    PriceOverride = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorAvailabilityCalendars", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorAvailabilityCalendars_VendorListings_VendorListingId",
                        column: x => x.VendorListingId,
                        principalTable: "VendorListings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VendorBookings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VendorAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    VendorListingId = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    GuestName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    GuestContact = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    GuestEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CheckIn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CheckOut = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Units = table.Column<int>(type: "integer", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CommissionAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    NetAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorBookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorBookings_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorBookings_VendorAccounts_VendorAccountId",
                        column: x => x.VendorAccountId,
                        principalTable: "VendorAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorBookings_VendorListings_VendorListingId",
                        column: x => x.VendorListingId,
                        principalTable: "VendorListings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VendorPayoutLineItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VendorPayoutId = table.Column<Guid>(type: "uuid", nullable: false),
                    VendorBookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CommissionAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    NetAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorPayoutLineItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorPayoutLineItems_VendorBookings_VendorBookingId",
                        column: x => x.VendorBookingId,
                        principalTable: "VendorBookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorPayoutLineItems_VendorPayouts_VendorPayoutId",
                        column: x => x.VendorPayoutId,
                        principalTable: "VendorPayouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VendorAccounts_UserId",
                table: "VendorAccounts",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VendorAvailabilityCalendars_VendorListingId_Date",
                table: "VendorAvailabilityCalendars",
                columns: new[] { "VendorListingId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VendorBookings_BookingId",
                table: "VendorBookings",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorBookings_VendorAccountId",
                table: "VendorBookings",
                column: "VendorAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorBookings_VendorListingId",
                table: "VendorBookings",
                column: "VendorListingId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorCommissions_VendorAccountId",
                table: "VendorCommissions",
                column: "VendorAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorListings_VendorAccountId",
                table: "VendorListings",
                column: "VendorAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorPayoutLineItems_VendorBookingId",
                table: "VendorPayoutLineItems",
                column: "VendorBookingId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorPayoutLineItems_VendorPayoutId",
                table: "VendorPayoutLineItems",
                column: "VendorPayoutId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorPayouts_VendorAccountId",
                table: "VendorPayouts",
                column: "VendorAccountId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VendorAvailabilityCalendars");

            migrationBuilder.DropTable(
                name: "VendorCommissions");

            migrationBuilder.DropTable(
                name: "VendorPayoutLineItems");

            migrationBuilder.DropTable(
                name: "VendorBookings");

            migrationBuilder.DropTable(
                name: "VendorPayouts");

            migrationBuilder.DropTable(
                name: "VendorListings");

            migrationBuilder.DropTable(
                name: "VendorAccounts");
        }
    }
}
