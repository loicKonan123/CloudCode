using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudCode.Infrastructure.Data.Configurations;

public class QuizQuestionConfiguration : IEntityTypeConfiguration<QuizQuestion>
{
    public void Configure(EntityTypeBuilder<QuizQuestion> builder)
    {
        builder.ToTable("QuizQuestions");
        builder.HasKey(q => q.Id);
        builder.Property(q => q.Text).IsRequired();
        builder.Property(q => q.OptionA).IsRequired().HasMaxLength(500);
        builder.Property(q => q.OptionB).IsRequired().HasMaxLength(500);
        builder.Property(q => q.OptionC).IsRequired().HasMaxLength(500);
        builder.Property(q => q.OptionD).IsRequired().HasMaxLength(500);
        builder.Property(q => q.Explanation).HasMaxLength(1000);
        builder.HasIndex(q => q.Category);
        builder.HasIndex(q => q.Difficulty);
    }
}

public class QuizSessionConfiguration : IEntityTypeConfiguration<QuizSession>
{
    public void Configure(EntityTypeBuilder<QuizSession> builder)
    {
        builder.ToTable("QuizSessions");
        builder.HasKey(s => s.Id);
        builder.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(s => s.Answers)
            .WithOne(a => a.Session)
            .HasForeignKey(a => a.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(s => s.UserId);
        builder.HasIndex(s => new { s.UserId, s.Status });
    }
}

public class QuizSessionAnswerConfiguration : IEntityTypeConfiguration<QuizSessionAnswer>
{
    public void Configure(EntityTypeBuilder<QuizSessionAnswer> builder)
    {
        builder.ToTable("QuizSessionAnswers");
        builder.HasKey(a => a.Id);
        builder.HasOne(a => a.Question)
            .WithMany()
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(a => new { a.SessionId, a.QuestionIndex }).IsUnique();
    }
}

public class QuizVsMatchConfiguration : IEntityTypeConfiguration<QuizVsMatch>
{
    public void Configure(EntityTypeBuilder<QuizVsMatch> builder)
    {
        builder.ToTable("QuizVsMatches");
        builder.HasKey(m => m.Id);
        builder.HasOne(m => m.Player1)
            .WithMany()
            .HasForeignKey(m => m.Player1Id)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(m => m.Player2)
            .WithMany()
            .HasForeignKey(m => m.Player2Id)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Property(m => m.QuestionIds).IsRequired();
        builder.HasIndex(m => m.Player1Id);
        builder.HasIndex(m => m.Player2Id);
        builder.HasIndex(m => m.Status);
    }
}

public class QuizVsAnswerConfiguration : IEntityTypeConfiguration<QuizVsAnswer>
{
    public void Configure(EntityTypeBuilder<QuizVsAnswer> builder)
    {
        builder.ToTable("QuizVsAnswers");
        builder.HasKey(a => a.Id);
        builder.HasOne(a => a.Match)
            .WithMany()
            .HasForeignKey(a => a.MatchId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(a => a.Player)
            .WithMany()
            .HasForeignKey(a => a.PlayerId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(a => new { a.MatchId, a.PlayerId, a.QuestionIndex }).IsUnique();
    }
}

public class QuizRankConfiguration : IEntityTypeConfiguration<QuizRank>
{
    public void Configure(EntityTypeBuilder<QuizRank> builder)
    {
        builder.ToTable("QuizRanks");
        builder.HasKey(r => r.Id);
        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(r => r.UserId).IsUnique();
        builder.HasIndex(r => r.Elo);
    }
}
