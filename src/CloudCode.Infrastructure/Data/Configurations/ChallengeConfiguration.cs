using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudCode.Infrastructure.Data.Configurations;

public class ChallengeConfiguration : IEntityTypeConfiguration<Challenge>
{
    public void Configure(EntityTypeBuilder<Challenge> builder)
    {
        builder.ToTable("Challenges");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Title).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Slug).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Description).IsRequired();
        builder.Property(c => c.Tags).HasMaxLength(1000);

        builder.HasIndex(c => c.Slug).IsUnique();
        builder.HasIndex(c => c.IsPublished);
        builder.HasIndex(c => c.Difficulty);
    }
}

public class TestCaseConfiguration : IEntityTypeConfiguration<TestCase>
{
    public void Configure(EntityTypeBuilder<TestCase> builder)
    {
        builder.ToTable("TestCases");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Input).IsRequired();
        builder.Property(t => t.ExpectedOutput).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(500);

        builder.HasOne(t => t.Challenge)
            .WithMany(c => c.TestCases)
            .HasForeignKey(t => t.ChallengeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.ChallengeId);
    }
}

public class UserSubmissionConfiguration : IEntityTypeConfiguration<UserSubmission>
{
    public void Configure(EntityTypeBuilder<UserSubmission> builder)
    {
        builder.ToTable("UserSubmissions");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Code).IsRequired();

        builder.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Challenge)
            .WithMany(c => c.Submissions)
            .HasForeignKey(s => s.ChallengeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => new { s.UserId, s.ChallengeId });
        builder.HasIndex(s => s.SubmittedAt);
    }
}

public class UserProgressConfiguration : IEntityTypeConfiguration<UserProgress>
{
    public void Configure(EntityTypeBuilder<UserProgress> builder)
    {
        builder.ToTable("UserProgress");
        builder.HasKey(p => new { p.UserId, p.ChallengeId });

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Challenge)
            .WithMany()
            .HasForeignKey(p => p.ChallengeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
