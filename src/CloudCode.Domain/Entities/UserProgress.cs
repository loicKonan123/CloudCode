namespace CloudCode.Domain.Entities;

public class UserProgress
{
    public Guid UserId { get; set; }
    public Guid ChallengeId { get; set; }
    public bool IsSolved { get; set; }
    public int BestScore { get; set; }
    public int AttemptCount { get; set; }
    public DateTime LastAttemptAt { get; set; }

    // Navigation
    public virtual User User { get; set; } = null!;
    public virtual Challenge Challenge { get; set; } = null!;
}
