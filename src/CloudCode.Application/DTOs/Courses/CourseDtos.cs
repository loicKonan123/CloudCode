namespace CloudCode.Application.DTOs.Courses;

public class CourseListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Language { get; set; }
    public int ChallengeCount { get; set; }
    public bool IsPublished { get; set; }
    public int OrderIndex { get; set; }
}

public class CourseChallengeDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int Difficulty { get; set; }
    public List<string> Tags { get; set; } = [];
    public int OrderIndex { get; set; }
    public bool IsSolved { get; set; }
}

public class CourseDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Language { get; set; }
    public bool IsPublished { get; set; }
    public int OrderIndex { get; set; }
    public List<CourseChallengeDto> Challenges { get; set; } = [];
}

public class CreateCourseDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Language { get; set; }
    public int OrderIndex { get; set; }
    public bool IsPublished { get; set; }
    public List<Guid> ChallengeIds { get; set; } = [];
}

public class UpdateCourseDto : CreateCourseDto { }
