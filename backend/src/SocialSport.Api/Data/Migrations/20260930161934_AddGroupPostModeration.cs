using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SocialSport.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupPostModeration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GroupModerationStatus",
                table: "Posts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                "UPDATE [Posts] SET [GroupModerationStatus] = 2 " +
                "WHERE [GroupId] IS NOT NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GroupModerationStatus",
                table: "Posts");
        }
    }
}
