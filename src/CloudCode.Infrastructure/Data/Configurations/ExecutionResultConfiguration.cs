using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudCode.Infrastructure.Data.Configurations;

public class ExecutionResultConfiguration : IEntityTypeConfiguration<ExecutionResult>
{
    public void Configure(EntityTypeBuilder<ExecutionResult> builder)
    {
        builder.ToTable("ExecutionResults");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code)
            .IsRequired(); // SQLite TEXT

        builder.Property(e => e.Output); // SQLite TEXT

        builder.Property(e => e.ErrorOutput); // SQLite TEXT

        // Relation avec Project
        builder.HasOne(e => e.Project)
            .WithMany(p => p.ExecutionResults)
            .HasForeignKey(e => e.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relation avec CodeFile
        builder.HasOne(e => e.File)
            .WithMany()
            .HasForeignKey(e => e.FileId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relation avec User
        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Index sur ProjectId pour l'historique
        builder.HasIndex(e => e.ProjectId);

        // Index sur CreatedAt pour le tri chronologique
        builder.HasIndex(e => e.CreatedAt);
    }
}
