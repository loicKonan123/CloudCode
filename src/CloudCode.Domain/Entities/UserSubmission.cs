using CloudCode.Domain.Common;
using CloudCode.Domain.Enums;

namespace CloudCode.Domain.Entities;

public class UserSubmission : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ChallengeId { get; set; }
    public ChallengeLanguage Language { get; set; }
    public string Code { get; set; } = string.Empty;
    public SubmissionStatus Status { get; set; }
    public int PassedTests { get; set; }
    public int TotalTests { get; set; }
    public int Score { get; set; }
    public double ExecutionTimeMs { get; set; }
    public string? ErrorOutput { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual User User { get; set; } = null!;
    public virtual Challenge Challenge { get; set; } = null!;
}
