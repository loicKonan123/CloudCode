using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudCode.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVsMatchPerPlayerLanguage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Rename Language → Player1Language
            migrationBuilder.RenameColumn(
                name: "Language",
                table: "VsMatches",
                newName: "Player1Language");

            // Add Player2Language column (default same as player1 for existing rows)
            migrationBuilder.AddColumn<string>(
                name: "Player2Language",
                table: "VsMatches",
                type: "TEXT",
                nullable: false,
                defaultValue: "python");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Player2Language",
                table: "VsMatches");

            migrationBuilder.RenameColumn(
                name: "Player1Language",
                table: "VsMatches",
                newName: "Language");
        }
    }
}
