namespace CloudCode.Application.DTOs.Courses;

public class LessonListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public bool IsPublished { get; set; }
    public bool HasChallenge { get; set; }
    public string? ChallengeSlug { get; set; }
}

public class LessonDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public bool IsPublished { get; set; }
    public string? ChallengeSlug { get; set; }
    public string? ChallengeTitle { get; set; }
    public string? NextLessonSlug { get; set; }
    public string? PrevLessonSlug { get; set; }
}

public class CreateLessonDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public bool IsPublished { get; set; }
    public Guid? ChallengeId { get; set; }
}

public class UpdateLessonDto : CreateLessonDto { }
