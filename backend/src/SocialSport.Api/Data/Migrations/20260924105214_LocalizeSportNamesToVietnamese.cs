using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SocialSport.Api.Data.Migrations
{
    public partial class LocalizeSportNamesToVietnamese : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE [Sports] SET [Name] = N'Bóng đá' WHERE [Slug] = N'football'");

            migrationBuilder.Sql(
                "UPDATE [Sports] SET [Name] = N'Bóng rổ' WHERE [Slug] = N'basketball'");

            migrationBuilder.Sql(
                "UPDATE [Sports] SET [Name] = N'Cầu lông' WHERE [Slug] = N'badminton'");

            migrationBuilder.Sql(
                "UPDATE [Sports] SET [Name] = N'Bóng chuyền' WHERE [Slug] = N'volleyball'");

            migrationBuilder.Sql(
                "UPDATE [Sports] SET [Name] = N'Chạy bộ' WHERE [Slug] = N'running'");

            migrationBuilder.Sql(
                "UPDATE [Sports] SET [Name] = N'Quần vợt' WHERE [Slug] = N'tennis'");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE [Sports] SET [Name] = N'Football' WHERE [Slug] = N'football'");

            migrationBuilder.Sql(
                "UPDATE [Sports] SET [Name] = N'Basketball' WHERE [Slug] = N'basketball'");

            migrationBuilder.Sql(
                "UPDATE [Sports] SET [Name] = N'Badminton' WHERE [Slug] = N'badminton'");

            migrationBuilder.Sql(
                "UPDATE [Sports] SET [Name] = N'Volleyball' WHERE [Slug] = N'volleyball'");

            migrationBuilder.Sql(
                "UPDATE [Sports] SET [Name] = N'Running' WHERE [Slug] = N'running'");

            migrationBuilder.Sql(
                "UPDATE [Sports] SET [Name] = N'Tennis' WHERE [Slug] = N'tennis'");
        }
    }
}