using CloudCode.Domain.Common;
using CloudCode.Domain.Enums;

namespace CloudCode.Domain.Entities;

public class VsMatch : BaseEntity
{
    public Guid Player1Id { get; set; }
    public Guid Player2Id { get; set; }
    public Guid ChallengeId { get; set; }
    public Guid? WinnerId { get; set; }
    public VsMatchStatus Status { get; set; } = VsMatchStatus.Waiting;
    public string Player1Language { get; set; } = "python";
    public string Player2Language { get; set; } = "python";
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public int Player1EloChange { get; set; }
    public int Player2EloChange { get; set; }
    public bool Player1Submitted { get; set; }
    public bool Player2Submitted { get; set; }

    // Navigation
    public virtual User Player1 { get; set; } = null!;
    public virtual User Player2 { get; set; } = null!;
    public virtual Challenge Challenge { get; set; } = null!;
}
