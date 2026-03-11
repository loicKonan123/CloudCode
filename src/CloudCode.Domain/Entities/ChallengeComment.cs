using CloudCode.Domain.Common;

namespace CloudCode.Domain.Entities;

public class ChallengeComment : BaseEntity
{
    public Guid ChallengeId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }

    public virtual Challenge Challenge { get; set; } = null!;
    public virtual User User { get; set; } = null!;
    public virtual ChallengeComment? Parent { get; set; }
    public virtual ICollection<ChallengeComment> Replies { get; set; } = new List<ChallengeComment>();
}
