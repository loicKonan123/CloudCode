using CloudCode.Domain.Common;
using CloudCode.Domain.Enums;

namespace CloudCode.Domain.Entities;

public class QuizQuestion : BaseEntity
{
    public string Text { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public int CorrectOption { get; set; } // 0=A, 1=B, 2=C, 3=D
    public QuizCategory Category { get; set; }
    public QuizDifficulty Difficulty { get; set; }
    public string? Explanation { get; set; }
    public bool IsPublished { get; set; } = true;
}
