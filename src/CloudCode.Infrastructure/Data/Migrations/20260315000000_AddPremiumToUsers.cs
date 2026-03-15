using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudCode.Infrastructure.Data.Migrations;

public partial class AddPremiumToUsers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsPremium",
            table: "Users",
            type: "INTEGER",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<DateTime>(
            name: "PremiumExpiresAt",
            table: "Users",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "StripeCustomerId",
            table: "Users",
            type: "TEXT",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "StripeSubscriptionId",
            table: "Users",
            type: "TEXT",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "IsPremium",            table: "Users");
        migrationBuilder.DropColumn(name: "PremiumExpiresAt",     table: "Users");
        migrationBuilder.DropColumn(name: "StripeCustomerId",     table: "Users");
        migrationBuilder.DropColumn(name: "StripeSubscriptionId", table: "Users");
    }
}
