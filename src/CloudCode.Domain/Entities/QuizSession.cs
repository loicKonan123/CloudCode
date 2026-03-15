using CloudCode.Domain.Common;
using CloudCode.Domain.Enums;

namespace CloudCode.Domain.Entities;

public class QuizSession : BaseEntity
{
    public Guid UserId { get; set; }
    public QuizCategory Category { get; set; }
    public QuizDifficulty Difficulty { get; set; }
    public QuizSessionStatus Status { get; set; } = QuizSessionStatus.InProgress;
    public int Score { get; set; }
    public int TotalQuestions { get; set; } = 10;
    public int CorrectAnswers { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation
    public virtual User User { get; set; } = null!;
    public virtual ICollection<QuizSessionAnswer> Answers { get; set; } = new List<QuizSessionAnswer>();
}
