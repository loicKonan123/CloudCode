using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudCode.Infrastructure.Data.Configurations;

public class CollaborationConfiguration : IEntityTypeConfiguration<Collaboration>
{
    public void Configure(EntityTypeBuilder<Collaboration> builder)
    {
        builder.ToTable("Collaborations");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.InvitedByEmail)
            .HasMaxLength(255);

        // Relation avec Project
        builder.HasOne(c => c.Project)
            .WithMany(p => p.Collaborators)
            .HasForeignKey(c => c.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relation avec User
        builder.HasOne(c => c.User)
            .WithMany(u => u.Collaborations)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index unique pour éviter les doublons (un user par projet)
        builder.HasIndex(c => new { c.ProjectId, c.UserId })
            .IsUnique();

        // Index sur UserId pour les requêtes par utilisateur
        builder.HasIndex(c => c.UserId);
    }
}
