using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudCode.Infrastructure.Data.Migrations
{
    public partial class AddChallengeFunctionMode : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFunction",
                table: "Challenges",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TestRunnerPython",
                table: "Challenges",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TestRunnerJavaScript",
                table: "Challenges",
                type: "TEXT",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "IsFunction", table: "Challenges");
            migrationBuilder.DropColumn(name: "TestRunnerPython", table: "Challenges");
            migrationBuilder.DropColumn(name: "TestRunnerJavaScript", table: "Challenges");
        }
    }
}
