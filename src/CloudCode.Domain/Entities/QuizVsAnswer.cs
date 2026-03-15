using CloudCode.Domain.Common;

namespace CloudCode.Domain.Entities;

public class QuizVsAnswer : BaseEntity
{
    public Guid MatchId { get; set; }
    public Guid PlayerId { get; set; }
    public Guid QuestionId { get; set; }
    public int QuestionIndex { get; set; }
    public int? SelectedOption { get; set; } // null = timeout
    public bool IsCorrect { get; set; }
    public int TimeTakenMs { get; set; }
    public bool IsFirst { get; set; } // first player to answer = 2 pts if correct

    // Navigation
    public virtual QuizVsMatch Match { get; set; } = null!;
    public virtual User Player { get; set; } = null!;
}
