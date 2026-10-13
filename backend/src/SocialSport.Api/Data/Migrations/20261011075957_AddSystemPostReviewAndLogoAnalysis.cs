using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SocialSport.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemPostReviewAndLogoAnalysis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Posts",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<int>(
                name: "SystemModerationStatus",
                table: "Posts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "LogoAnalysisJson",
                table: "PostMedia",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE Posts
                SET SystemModerationStatus = 1, Status = 2
                WHERE GroupId IS NULL AND Status IN (1, 2);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "SystemModerationStatus",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "LogoAnalysisJson",
                table: "PostMedia");
        }
    }
}

