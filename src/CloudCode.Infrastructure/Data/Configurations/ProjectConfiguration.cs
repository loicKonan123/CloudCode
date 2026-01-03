using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudCode.Infrastructure.Data.Configurations;

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("Projects");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.Description)
            .HasMaxLength(500);

        builder.Property(p => p.Tags)
            .HasMaxLength(1000); // JSON array

        // Relation avec Owner (User)
        builder.HasOne(p => p.Owner)
            .WithMany(u => u.Projects)
            .HasForeignKey(p => p.OwnerId)
            .OnDelete(DeleteBehavior.Restrict); // Ne pas supprimer les projets si l'utilisateur est supprimé

        // Index sur OwnerId pour les requêtes par propriétaire
        builder.HasIndex(p => p.OwnerId);

        // Index sur IsPublic pour les requêtes de projets publics
        builder.HasIndex(p => p.IsPublic);

        // Index composite pour la recherche
        builder.HasIndex(p => new { p.Name, p.Language });
    }
}
