using CloudCode.Domain.Common;
using CloudCode.Domain.Enums;

namespace CloudCode.Domain.Entities;

public class Challenge : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ChallengeDifficulty Difficulty { get; set; }
    public ChallengeLanguage SupportedLanguages { get; set; }
    public string? StarterCodePython { get; set; }
    public string? StarterCodeJavaScript { get; set; }
    public string Tags { get; set; } = string.Empty; // JSON array stored as string
    public bool IsPublished { get; set; }

    // Navigation properties
    public virtual ICollection<TestCase> TestCases { get; set; } = new List<TestCase>();
    public virtual ICollection<UserSubmission> Submissions { get; set; } = new List<UserSubmission>();
}
