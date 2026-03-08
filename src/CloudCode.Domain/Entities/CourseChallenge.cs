namespace CloudCode.Domain.Entities;

public class CourseChallenge
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid ChallengeId { get; set; }
    public int OrderIndex { get; set; }
    public virtual Course Course { get; set; } = null!;
    public virtual Challenge Challenge { get; set; } = null!;
}
