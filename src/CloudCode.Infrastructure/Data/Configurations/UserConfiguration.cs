using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudCode.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(u => u.Username)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(u => u.Avatar)
            .HasMaxLength(500);

        builder.Property(u => u.Bio)
            .HasMaxLength(500);

        builder.Property(u => u.RefreshToken)
            .HasMaxLength(500);

        // Index unique sur Email
        builder.HasIndex(u => u.Email)
            .IsUnique();

        // Index unique sur Username
        builder.HasIndex(u => u.Username)
            .IsUnique();

        // Index sur RefreshToken pour les recherches rapides
        builder.HasIndex(u => u.RefreshToken);
    }
}
