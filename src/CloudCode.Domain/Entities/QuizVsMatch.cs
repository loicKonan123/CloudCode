using CloudCode.Domain.Common;
using CloudCode.Domain.Enums;

namespace CloudCode.Domain.Entities;

public class QuizVsMatch : BaseEntity
{
    public Guid Player1Id { get; set; }
    public Guid Player2Id { get; set; }
    public QuizCategory Category { get; set; }
    public QuizDifficulty Difficulty { get; set; }
    public string QuestionIds { get; set; } = "[]"; // JSON array of Guid strings
    public QuizVsMatchStatus Status { get; set; } = QuizVsMatchStatus.Waiting;
    public Guid? WinnerId { get; set; }
    public int Player1Score { get; set; }
    public int Player2Score { get; set; }
    public int Player1EloChange { get; set; }
    public int Player2EloChange { get; set; }
    public int CurrentQuestionIndex { get; set; } = 0;
    public bool Player1Finished { get; set; }
    public bool Player2Finished { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }

    // Navigation
    public virtual User Player1 { get; set; } = null!;
    public virtual User Player2 { get; set; } = null!;
}
