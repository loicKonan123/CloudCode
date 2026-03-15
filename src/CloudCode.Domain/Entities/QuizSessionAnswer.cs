using CloudCode.Domain.Common;

namespace CloudCode.Domain.Entities;

public class QuizSessionAnswer : BaseEntity
{
    public Guid SessionId { get; set; }
    public Guid QuestionId { get; set; }
    public int QuestionIndex { get; set; } // 0–9
    public int? SelectedOption { get; set; } // null = timeout
    public bool IsCorrect { get; set; }
    public int TimeTakenMs { get; set; }

    // Navigation
    public virtual QuizSession Session { get; set; } = null!;
    public virtual QuizQuestion Question { get; set; } = null!;
}
