using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudCode.Infrastructure.Data.Configurations;

public class CodeFileConfiguration : IEntityTypeConfiguration<CodeFile>
{
    public void Configure(EntityTypeBuilder<CodeFile> builder)
    {
        builder.ToTable("CodeFiles");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(f => f.Path)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(f => f.Content); // SQLite uses TEXT - no size limit

        // Relation avec Project
        builder.HasOne(f => f.Project)
            .WithMany(p => p.Files)
            .HasForeignKey(f => f.ProjectId)
            .OnDelete(DeleteBehavior.Cascade); // Supprimer les fichiers si le projet est supprimé

        // Relation parent/enfant pour la hiérarchie
        builder.HasOne(f => f.Parent)
            .WithMany(f => f.Children)
            .HasForeignKey(f => f.ParentId)
            .OnDelete(DeleteBehavior.Restrict); // Éviter les suppressions en cascade récursives

        // Index sur ProjectId pour les requêtes par projet
        builder.HasIndex(f => f.ProjectId);

        // Index unique sur Path dans un projet
        builder.HasIndex(f => new { f.ProjectId, f.Path })
            .IsUnique();

        // Index sur ParentId pour les requêtes d'enfants
        builder.HasIndex(f => f.ParentId);
    }
}
