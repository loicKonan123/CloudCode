using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudCode.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddStreakAndOfficialSolution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BestChallengeStreak",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ChallengeStreak",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastChallengeSolvedDate",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Hints",
                table: "Challenges",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficialSolutionJS",
                table: "Challenges",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficialSolutionPython",
                table: "Challenges",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BestChallengeStreak",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ChallengeStreak",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastChallengeSolvedDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Hints",
                table: "Challenges");

            migrationBuilder.DropColumn(
                name: "OfficialSolutionJS",
                table: "Challenges");

            migrationBuilder.DropColumn(
                name: "OfficialSolutionPython",
                table: "Challenges");
        }
    }
}
