using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudCode.Infrastructure.Data.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Action)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.Details); // JSON - SQLite uses TEXT

        builder.Property(a => a.IpAddress)
            .HasMaxLength(45); // IPv6 max length

        builder.Property(a => a.UserAgent)
            .HasMaxLength(500);

        // Relation avec User
        builder.HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relation avec Project (optionnel)
        builder.HasOne(a => a.Project)
            .WithMany()
            .HasForeignKey(a => a.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);

        // Index sur UserId pour l'historique utilisateur
        builder.HasIndex(a => a.UserId);

        // Index sur ProjectId pour l'historique projet
        builder.HasIndex(a => a.ProjectId);

        // Index sur CreatedAt pour le tri chronologique
        builder.HasIndex(a => a.CreatedAt);

        // Index composite pour la recherche d'actions
        builder.HasIndex(a => new { a.Action, a.CreatedAt });
    }
}
