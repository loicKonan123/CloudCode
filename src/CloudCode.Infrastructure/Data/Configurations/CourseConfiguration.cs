using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudCode.Infrastructure.Data.Configurations;

public class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Title).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Slug).IsRequired().HasMaxLength(200);
        builder.HasIndex(c => c.Slug).IsUnique();
        builder.Property(c => c.Description).IsRequired();
        builder.HasMany(c => c.CourseChallenges)
            .WithOne(cc => cc.Course)
            .HasForeignKey(cc => cc.CourseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CourseChallengeConfiguration : IEntityTypeConfiguration<CourseChallenge>
{
    public void Configure(EntityTypeBuilder<CourseChallenge> builder)
    {
        builder.HasKey(cc => cc.Id);
        builder.HasOne(cc => cc.Challenge)
            .WithMany()
            .HasForeignKey(cc => cc.ChallengeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
