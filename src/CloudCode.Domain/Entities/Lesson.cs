using CloudCode.Domain.Common;

namespace CloudCode.Domain.Entities;

public class Lesson : BaseEntity
{
    public Guid CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty; // Markdown content
    public int OrderIndex { get; set; }
    public bool IsPublished { get; set; }
    public Guid? ChallengeId { get; set; } // Optional linked challenge (exercise)

    public virtual Course Course { get; set; } = null!;
    public virtual Challenge? Challenge { get; set; }
}
