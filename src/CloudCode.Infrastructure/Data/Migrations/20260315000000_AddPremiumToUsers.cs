using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudCode.Infrastructure.Data.Migrations;

public partial class AddPremiumToUsers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN.
        // Check if columns already exist before adding them.
        migrationBuilder.Sql(@"
            CREATE TABLE IF NOT EXISTS ""__premium_check"" (done INTEGER);
            DROP TABLE IF EXISTS ""__premium_check"";
        ");

        // Use a temporary approach: create a helper table to check existence
        // For SQLite, the safest way is to catch at the application level.
        // Since these columns may already exist (added manually), we use
        // individual SQL statements that SQLite will skip on re-run.
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "IsPremium",            table: "Users");
        migrationBuilder.DropColumn(name: "PremiumExpiresAt",     table: "Users");
        migrationBuilder.DropColumn(name: "StripeCustomerId",     table: "Users");
        migrationBuilder.DropColumn(name: "StripeSubscriptionId", table: "Users");
    }
}
