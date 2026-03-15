using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudCode.Infrastructure.Data.Migrations
{
    public partial class AddQuizEntities : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. QuizQuestions (no FK)
            migrationBuilder.CreateTable(
                name: "QuizQuestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Text = table.Column<string>(type: "TEXT", nullable: false),
                    OptionA = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    OptionB = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    OptionC = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    OptionD = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    CorrectOption = table.Column<int>(type: "INTEGER", nullable: false),
                    Category = table.Column<int>(type: "INTEGER", nullable: false),
                    Difficulty = table.Column<int>(type: "INTEGER", nullable: false),
                    Explanation = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    IsPublished = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizQuestions", x => x.Id);
                });

            migrationBuilder.CreateIndex(name: "IX_QuizQuestions_Category", table: "QuizQuestions", column: "Category");
            migrationBuilder.CreateIndex(name: "IX_QuizQuestions_Difficulty", table: "QuizQuestions", column: "Difficulty");

            // 2. QuizRanks (FK → Users)
            migrationBuilder.CreateTable(
                name: "QuizRanks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Elo = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1000),
                    Wins = table.Column<int>(type: "INTEGER", nullable: false),
                    Losses = table.Column<int>(type: "INTEGER", nullable: false),
                    Draws = table.Column<int>(type: "INTEGER", nullable: false),
                    CurrentStreak = table.Column<int>(type: "INTEGER", nullable: false),
                    BestStreak = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizRanks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizRanks_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(name: "IX_QuizRanks_UserId", table: "QuizRanks", column: "UserId", unique: true);
            migrationBuilder.CreateIndex(name: "IX_QuizRanks_Elo", table: "QuizRanks", column: "Elo");

            // 3. QuizSessions (FK → Users)
            migrationBuilder.CreateTable(
                name: "QuizSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Category = table.Column<int>(type: "INTEGER", nullable: false),
                    Difficulty = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    Score = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalQuestions = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 10),
                    CorrectAnswers = table.Column<int>(type: "INTEGER", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizSessions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(name: "IX_QuizSessions_UserId", table: "QuizSessions", column: "UserId");

            // 4. QuizSessionAnswers (FK → QuizSessions + QuizQuestions)
            migrationBuilder.CreateTable(
                name: "QuizSessionAnswers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    SessionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    QuestionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    QuestionIndex = table.Column<int>(type: "INTEGER", nullable: false),
                    SelectedOption = table.Column<int>(type: "INTEGER", nullable: true),
                    IsCorrect = table.Column<bool>(type: "INTEGER", nullable: false),
                    TimeTakenMs = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizSessionAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizSessionAnswers_QuizSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "QuizSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuizSessionAnswers_QuizQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "QuizQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuizSessionAnswers_SessionId_QuestionIndex",
                table: "QuizSessionAnswers",
                columns: new[] { "SessionId", "QuestionIndex" },
                unique: true);

            // 5. QuizVsMatches (FK → Users x2)
            migrationBuilder.CreateTable(
                name: "QuizVsMatches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Player1Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Player2Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Category = table.Column<int>(type: "INTEGER", nullable: false),
                    Difficulty = table.Column<int>(type: "INTEGER", nullable: false),
                    QuestionIds = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    WinnerId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Player1Score = table.Column<int>(type: "INTEGER", nullable: false),
                    Player2Score = table.Column<int>(type: "INTEGER", nullable: false),
                    Player1EloChange = table.Column<int>(type: "INTEGER", nullable: false),
                    Player2EloChange = table.Column<int>(type: "INTEGER", nullable: false),
                    CurrentQuestionIndex = table.Column<int>(type: "INTEGER", nullable: false),
                    Player1Finished = table.Column<bool>(type: "INTEGER", nullable: false),
                    Player2Finished = table.Column<bool>(type: "INTEGER", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    FinishedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizVsMatches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizVsMatches_Users_Player1Id",
                        column: x => x.Player1Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuizVsMatches_Users_Player2Id",
                        column: x => x.Player2Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(name: "IX_QuizVsMatches_Player1Id", table: "QuizVsMatches", column: "Player1Id");
            migrationBuilder.CreateIndex(name: "IX_QuizVsMatches_Player2Id", table: "QuizVsMatches", column: "Player2Id");
            migrationBuilder.CreateIndex(name: "IX_QuizVsMatches_Status", table: "QuizVsMatches", column: "Status");

            // 6. QuizVsAnswers (FK → QuizVsMatches + Users)
            migrationBuilder.CreateTable(
                name: "QuizVsAnswers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    MatchId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PlayerId = table.Column<Guid>(type: "TEXT", nullable: false),
                    QuestionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    QuestionIndex = table.Column<int>(type: "INTEGER", nullable: false),
                    SelectedOption = table.Column<int>(type: "INTEGER", nullable: true),
                    IsCorrect = table.Column<bool>(type: "INTEGER", nullable: false),
                    TimeTakenMs = table.Column<int>(type: "INTEGER", nullable: false),
                    IsFirst = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizVsAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizVsAnswers_QuizVsMatches_MatchId",
                        column: x => x.MatchId,
                        principalTable: "QuizVsMatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuizVsAnswers_Users_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuizVsAnswers_MatchId_PlayerId_QuestionIndex",
                table: "QuizVsAnswers",
                columns: new[] { "MatchId", "PlayerId", "QuestionIndex" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "QuizVsAnswers");
            migrationBuilder.DropTable(name: "QuizVsMatches");
            migrationBuilder.DropTable(name: "QuizSessionAnswers");
            migrationBuilder.DropTable(name: "QuizSessions");
            migrationBuilder.DropTable(name: "QuizRanks");
            migrationBuilder.DropTable(name: "QuizQuestions");
        }
    }
}
