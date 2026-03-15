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

public class LessonConfiguration : IEntityTypeConfiguration<Lesson>
{
    public void Configure(EntityTypeBuilder<Lesson> builder)
    {
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Title).IsRequired().HasMaxLength(300);
        builder.Property(l => l.Slug).IsRequired().HasMaxLength(300);
        builder.Property(l => l.Content).IsRequired();
        builder.HasIndex(l => new { l.CourseId, l.Slug }).IsUnique();
        builder.HasOne(l => l.Course)
            .WithMany(c => c.Lessons)
            .HasForeignKey(l => l.CourseId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(l => l.Challenge)
            .WithMany()
            .HasForeignKey(l => l.ChallengeId)
            .OnDelete(DeleteBehavior.SetNull);
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
