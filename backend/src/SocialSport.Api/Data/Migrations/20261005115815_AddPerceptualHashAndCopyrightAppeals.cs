using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SocialSport.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPerceptualHashAndCopyrightAppeals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PerceptualHash",
                table: "PostMedia",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AppealReason",
                table: "ExternalCopyrightScans",
                type: "nvarchar(3000)",
                maxLength: 3000,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "AppealedAt",
                table: "ExternalCopyrightScans",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PerceptualHash",
                table: "CopyrightAssets",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PostMedia_PerceptualHash",
                table: "PostMedia",
                column: "PerceptualHash");

            migrationBuilder.CreateIndex(
                name: "IX_CopyrightAssets_PerceptualHash_Status",
                table: "CopyrightAssets",
                columns: new[] { "PerceptualHash", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PostMedia_PerceptualHash",
                table: "PostMedia");

            migrationBuilder.DropIndex(
                name: "IX_CopyrightAssets_PerceptualHash_Status",
                table: "CopyrightAssets");

            migrationBuilder.DropColumn(
                name: "PerceptualHash",
                table: "PostMedia");

            migrationBuilder.DropColumn(
                name: "AppealReason",
                table: "ExternalCopyrightScans");

            migrationBuilder.DropColumn(
                name: "AppealedAt",
                table: "ExternalCopyrightScans");

            migrationBuilder.DropColumn(
                name: "PerceptualHash",
                table: "CopyrightAssets");
        }
    }
}
