using CloudCode.Domain.Common;

namespace CloudCode.Domain.Entities;

public class TestCase : BaseEntity
{
    public Guid ChallengeId { get; set; }
    public string Input { get; set; } = string.Empty;
    public string ExpectedOutput { get; set; } = string.Empty;
    public bool IsHidden { get; set; }
    public int OrderIndex { get; set; }
    public string? Description { get; set; }

    // Navigation
    public virtual Challenge Challenge { get; set; } = null!;
}
