using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudCode.Infrastructure.Data.Configurations;

public class ProjectDependencyConfiguration : IEntityTypeConfiguration<ProjectDependency>
{
    public void Configure(EntityTypeBuilder<ProjectDependency> builder)
    {
        builder.ToTable("ProjectDependencies");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(d => d.Version)
            .HasMaxLength(50);

        // Relation avec Project
        builder.HasOne(d => d.Project)
            .WithMany(p => p.Dependencies)
            .HasForeignKey(d => d.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index sur ProjectId pour les requêtes par projet
        builder.HasIndex(d => d.ProjectId);

        // Index unique pour éviter les doublons (un package par projet)
        builder.HasIndex(d => new { d.ProjectId, d.Name })
            .IsUnique();
    }
}
