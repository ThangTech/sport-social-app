using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SocialSport.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCopyrightProtection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContentHash",
                table: "PostMedia",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CopyrightAssets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    RightsOwnerName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    ContentHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    MediaType = table.Column<int>(type: "int", nullable: false),
                    ReferencePath = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    EvidenceNotes = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CopyrightAssets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CopyrightCases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CopyrightAssetId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PostMediaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UploaderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Confidence = table.Column<decimal>(type: "decimal(5,4)", precision: 5, scale: 4, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ReviewedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReviewedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DecisionNotes = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    AppealReason = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    AppealedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CopyrightCases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CopyrightCases_CopyrightAssets_CopyrightAssetId",
                        column: x => x.CopyrightAssetId,
                        principalTable: "CopyrightAssets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CopyrightCases_PostMedia_PostMediaId",
                        column: x => x.PostMediaId,
                        principalTable: "PostMedia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PostMedia_ContentHash",
                table: "PostMedia",
                column: "ContentHash");

            migrationBuilder.CreateIndex(
                name: "IX_CopyrightAssets_ContentHash_Status",
                table: "CopyrightAssets",
                columns: new[] { "ContentHash", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CopyrightCases_CopyrightAssetId_PostMediaId",
                table: "CopyrightCases",
                columns: new[] { "CopyrightAssetId", "PostMediaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CopyrightCases_PostMediaId",
                table: "CopyrightCases",
                column: "PostMediaId");

            migrationBuilder.CreateIndex(
                name: "IX_CopyrightCases_Status_CreatedAt",
                table: "CopyrightCases",
                columns: new[] { "Status", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CopyrightCases");

            migrationBuilder.DropTable(
                name: "CopyrightAssets");

            migrationBuilder.DropIndex(
                name: "IX_PostMedia_ContentHash",
                table: "PostMedia");

            migrationBuilder.DropColumn(
                name: "ContentHash",
                table: "PostMedia");
        }
    }
}
