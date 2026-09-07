using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SocialSport.Api.Data.Migrations
{
    public partial class SeedInitialData : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // =========================
            // ROLES
            // =========================

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[]
                {
                    "Id",
                    "Name",
                    "NormalizedName"
                },
                values: new object[,]
                {
                    {
                        Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"),
                        "USER",
                        "USER"
                    },
                    {
                        Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"),
                        "ADMIN",
                        "ADMIN"
                    }
                }
            );

            // =========================
            // SPORTS
            // =========================

            var seedDate = new DateTimeOffset(
                2026, 9, 7,
                0, 0, 0,
                TimeSpan.Zero
            );

            migrationBuilder.InsertData(
                table: "Sports",
                columns: new[]
                {
                    "Id",
                    "Name",
                    "Slug",
                    "IsActive",
                    "CreatedAt"
                },
                values: new object[,]
                {
                    {
                        Guid.Parse("11111111-1111-1111-1111-111111111111"),
                        "Football",
                        "football",
                        true,
                        seedDate
                    },
                    {
                        Guid.Parse("22222222-2222-2222-2222-222222222222"),
                        "Basketball",
                        "basketball",
                        true,
                        seedDate
                    },
                    {
                        Guid.Parse("33333333-3333-3333-3333-333333333333"),
                        "Badminton",
                        "badminton",
                        true,
                        seedDate
                    },
                    {
                        Guid.Parse("44444444-4444-4444-4444-444444444444"),
                        "Volleyball",
                        "volleyball",
                        true,
                        seedDate
                    },
                    {
                        Guid.Parse("55555555-5555-5555-5555-555555555555"),
                        "Running",
                        "running",
                        true,
                        seedDate
                    },
                    {
                        Guid.Parse("66666666-6666-6666-6666-666666666666"),
                        "Tennis",
                        "tennis",
                        true,
                        seedDate
                    }
                }
            );
        }
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
        table: "Sports",
        keyColumn: "Id",
        keyValue: Guid.Parse("11111111-1111-1111-1111-111111111111"));

            migrationBuilder.DeleteData(
                table: "Sports",
                keyColumn: "Id",
                keyValue: Guid.Parse("22222222-2222-2222-2222-222222222222"));

            migrationBuilder.DeleteData(
                table: "Sports",
                keyColumn: "Id",
                keyValue: Guid.Parse("33333333-3333-3333-3333-333333333333"));

            migrationBuilder.DeleteData(
                table: "Sports",
                keyColumn: "Id",
                keyValue: Guid.Parse("44444444-4444-4444-4444-444444444444"));

            migrationBuilder.DeleteData(
                table: "Sports",
                keyColumn: "Id",
                keyValue: Guid.Parse("55555555-5555-5555-5555-555555555555"));

            migrationBuilder.DeleteData(
                table: "Sports",
                keyColumn: "Id",
                keyValue: Guid.Parse("66666666-6666-6666-6666-666666666666"));

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"));

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"));
        }
    }
}
