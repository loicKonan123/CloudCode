using CloudCode.Domain.Enums;

namespace CloudCode.Application.DTOs.Challenges;

// --- Response DTOs ---

public class ChallengeListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public ChallengeDifficulty Difficulty { get; set; }
    public ChallengeLanguage SupportedLanguages { get; set; }
    public string[] Tags { get; set; } = [];
    public bool IsPublished { get; set; }
    public double SuccessRate { get; set; }
    // Per-user fields (null if not authenticated)
    public bool? IsSolved { get; set; }
    public int? BestScore { get; set; }
}

public class ChallengeDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ChallengeDifficulty Difficulty { get; set; }
    public ChallengeLanguage SupportedLanguages { get; set; }
    public string? StarterCodePython { get; set; }
    public string? StarterCodeJavaScript { get; set; }
    public string[] Tags { get; set; } = [];
    public List<TestCaseDto> VisibleTestCases { get; set; } = [];
    public int TotalTestCases { get; set; }
    // Per-user
    public bool? IsSolved { get; set; }
    public int? BestScore { get; set; }
    // Hints (toujours visibles, 1 par 1)
    public string[] Hints { get; set; } = [];
    // Solution officielle — visible uniquement si l'user a résolu (score 100)
    public string? OfficialSolutionPython { get; set; }
    public string? OfficialSolutionJS { get; set; }
}

public class TestCaseDto
{
    public Guid Id { get; set; }
    public string Input { get; set; } = string.Empty;
    public string ExpectedOutput { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public string? Description { get; set; }
}

// --- Request DTOs ---

public class CreateChallengeDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ChallengeDifficulty Difficulty { get; set; }
    public ChallengeLanguage SupportedLanguages { get; set; }
    public string? StarterCodePython { get; set; }
    public string? StarterCodeJavaScript { get; set; }
    public string[] Tags { get; set; } = [];
    public List<CreateTestCaseDto> TestCases { get; set; } = [];
    public string? OfficialSolutionPython { get; set; }
    public string? OfficialSolutionJS { get; set; }
    public string[]? Hints { get; set; }
}

public class UpdateChallengeDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public ChallengeDifficulty? Difficulty { get; set; }
    public ChallengeLanguage? SupportedLanguages { get; set; }
    public string? StarterCodePython { get; set; }
    public string? StarterCodeJavaScript { get; set; }
    public string[]? Tags { get; set; }
    public List<CreateTestCaseDto>? TestCases { get; set; }
    public string? OfficialSolutionPython { get; set; }
    public string? OfficialSolutionJS { get; set; }
    public string[]? Hints { get; set; }
}

public class CreateTestCaseDto
{
    public string Input { get; set; } = string.Empty;
    public string ExpectedOutput { get; set; } = string.Empty;
    public bool IsHidden { get; set; }
    public int OrderIndex { get; set; }
    public string? Description { get; set; }
}

// --- Submission DTOs ---

public class SubmitCodeDto
{
    public string Code { get; set; } = string.Empty;
    public ChallengeLanguage Language { get; set; }
}

public class TestResultDto
{
    public int TestIndex { get; set; }
    public string? Description { get; set; }
    public bool Passed { get; set; }
    public string? Input { get; set; }
    public string? ExpectedOutput { get; set; }
    public string? ActualOutput { get; set; }
    public string? Error { get; set; }
    public double ExecutionTimeMs { get; set; }
    public bool IsHidden { get; set; }
}

public class JudgeResultDto
{
    public SubmissionStatus Status { get; set; }
    public int PassedTests { get; set; }
    public int TotalTests { get; set; }
    public int Score { get; set; }
    public double TotalExecutionTimeMs { get; set; }
    public List<TestResultDto> Results { get; set; } = [];
}

public class SubmissionDto
{
    public Guid Id { get; set; }
    public ChallengeLanguage Language { get; set; }
    public string Code { get; set; } = string.Empty;
    public SubmissionStatus Status { get; set; }
    public int PassedTests { get; set; }
    public int TotalTests { get; set; }
    public int Score { get; set; }
    public double ExecutionTimeMs { get; set; }
    public string? ErrorOutput { get; set; }
    public DateTime SubmittedAt { get; set; }
}

// --- Leaderboard ---

public class LeaderboardEntryDto
{
    public int Rank { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public int TotalScore { get; set; }
    public int ChallengesSolved { get; set; }
    public int PerfectScores { get; set; }
}

public class LeaderboardPageDto
{
    public List<LeaderboardEntryDto> Items { get; set; } = [];
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
