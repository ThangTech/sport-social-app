using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SocialSport.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPostReactionPaginationIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_PostReactions_PostId_CreatedAt_UserId",
                table: "PostReactions",
                columns: new[] { "PostId", "CreatedAt", "UserId" },
                descending: new[] { false, true, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PostReactions_PostId_CreatedAt_UserId",
                table: "PostReactions");
        }
    }
}
