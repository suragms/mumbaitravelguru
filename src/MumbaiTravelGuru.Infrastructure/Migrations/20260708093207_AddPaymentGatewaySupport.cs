using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MumbaiTravelGuru.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentGatewaySupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "NeedsReconciliation",
                table: "Bookings",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NeedsReconciliation",
                table: "Bookings");
        }
    }
}
