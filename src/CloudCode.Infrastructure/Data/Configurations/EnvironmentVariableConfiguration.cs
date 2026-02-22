using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudCode.Infrastructure.Data.Configurations;

public class EnvironmentVariableConfiguration : IEntityTypeConfiguration<EnvironmentVariable>
{
    public void Configure(EntityTypeBuilder<EnvironmentVariable> builder)
    {
        builder.ToTable("EnvironmentVariables");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Key)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(e => e.Value)
            .IsRequired()
            .HasMaxLength(4000);

        builder.Property(e => e.IsSecret)
            .HasDefaultValue(false);

        // Relation avec Project
        builder.HasOne(e => e.Project)
            .WithMany(p => p.EnvironmentVariables)
            .HasForeignKey(e => e.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index sur ProjectId pour les requêtes par projet
        builder.HasIndex(e => e.ProjectId);

        // Index unique pour éviter les doublons (une clé par projet)
        builder.HasIndex(e => new { e.ProjectId, e.Key })
            .IsUnique();
    }
}
