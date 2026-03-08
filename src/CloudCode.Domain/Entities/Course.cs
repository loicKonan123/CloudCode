using CloudCode.Domain.Common;

namespace CloudCode.Domain.Entities;

public class Course : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Language { get; set; } // 1=Python, 2=JavaScript
    public int OrderIndex { get; set; }
    public bool IsPublished { get; set; }
    public virtual ICollection<CourseChallenge> CourseChallenges { get; set; } = new List<CourseChallenge>();
}
