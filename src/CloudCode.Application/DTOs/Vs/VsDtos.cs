using CloudCode.Domain.Enums;

namespace CloudCode.Application.DTOs.Vs;

// --- Response DTOs ---

public class VsRankDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public int Elo { get; set; }
    public string Tier { get; set; } = string.Empty;
    public int Wins { get; set; }
    public int Losses { get; set; }
    public int Draws { get; set; }
    public int CurrentStreak { get; set; }
    public int BestStreak { get; set; }
    public int GamesPlayed => Wins + Losses + Draws;
    public double WinRate => GamesPlayed == 0 ? 0 : Math.Round((double)Wins / GamesPlayed * 100, 1);
}

public class VsMatchDto
{
    public Guid Id { get; set; }
    public VsPlayerDto Player1 { get; set; } = null!;
    public VsPlayerDto Player2 { get; set; } = null!;
    public string ChallengeTitle { get; set; } = string.Empty;
    public string ChallengeSlug { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public VsMatchStatus Status { get; set; }
    public Guid? WinnerId { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public int Player1EloChange { get; set; }
    public int Player2EloChange { get; set; }
}

public class VsPlayerDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public int Elo { get; set; }
    public string Tier { get; set; } = string.Empty;
    public bool Submitted { get; set; }
}

public class VsLeaderboardEntryDto
{
    public int Rank { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public int Elo { get; set; }
    public string Tier { get; set; } = string.Empty;
    public int Wins { get; set; }
    public int Losses { get; set; }
    public double WinRate { get; set; }
}

public class VsMatchResultDto
{
    public bool Passed { get; set; }
    public int PassedTests { get; set; }
    public int TotalTests { get; set; }
    public int Score { get; set; }
    public long ExecutionTimeMs { get; set; }
    public string? ErrorOutput { get; set; }
}

// --- Request DTOs ---

public class JoinQueueDto
{
    public string Language { get; set; } = "python";
}

public class VsSubmitDto
{
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
}

// --- SignalR event payloads ---

public class MatchFoundPayload
{
    public Guid MatchId { get; set; }
    public VsPlayerDto Opponent { get; set; } = null!;
    public string ChallengeSlug { get; set; } = string.Empty;
    public string ChallengeTitle { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
}

public class OpponentStatusPayload
{
    public Guid PlayerId { get; set; }
    public string Event { get; set; } = string.Empty; // "submitted", "passed", "failed"
}

public class MatchEndedPayload
{
    public Guid MatchId { get; set; }
    public Guid? WinnerId { get; set; }
    public string? WinnerUsername { get; set; }
    public int Player1EloChange { get; set; }
    public int Player2EloChange { get; set; }
    public bool IsDraw { get; set; }
}
