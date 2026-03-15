namespace CloudCode.Application.DTOs.Quiz;

// ── Questions ────────────────────────────────────────────────────────────────

public class QuizQuestionDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public int Category { get; set; }
    public int Difficulty { get; set; }
}

public class QuizQuestionRevealDto : QuizQuestionDto
{
    public int CorrectOption { get; set; }
    public string? Explanation { get; set; }
}

// ── Solo Session ─────────────────────────────────────────────────────────────

public class QuizSessionDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int Category { get; set; }
    public int Difficulty { get; set; }
    public int Status { get; set; }
    public int Score { get; set; }
    public int TotalQuestions { get; set; }
    public int CorrectAnswers { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<QuizQuestionDto> Questions { get; set; } = new();
    public List<QuizSessionAnswerDto> Answers { get; set; } = new();
}

public class QuizSessionAnswerDto
{
    public int QuestionIndex { get; set; }
    public Guid QuestionId { get; set; }
    public int? SelectedOption { get; set; }
    public bool IsCorrect { get; set; }
    public int TimeTakenMs { get; set; }
    public QuizQuestionRevealDto Question { get; set; } = null!;
}

// ── VS Rank & Leaderboard ────────────────────────────────────────────────────

public class QuizRankDto
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

public class QuizLeaderboardEntryDto
{
    public int Rank { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public int Elo { get; set; }
    public string Tier { get; set; } = string.Empty;
    public int Wins { get; set; }
    public int Losses { get; set; }
    public double WinRate => (Wins + Losses) == 0 ? 0 : Math.Round((double)Wins / (Wins + Losses) * 100, 1);
}

// ── VS Match ─────────────────────────────────────────────────────────────────

public class QuizVsPlayerDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public int Elo { get; set; }
    public string Tier { get; set; } = string.Empty;
    public int Score { get; set; }
    public bool Finished { get; set; }
}

public class QuizVsMatchDto
{
    public Guid Id { get; set; }
    public QuizVsPlayerDto Player1 { get; set; } = null!;
    public QuizVsPlayerDto Player2 { get; set; } = null!;
    public int Status { get; set; }
    public Guid? WinnerId { get; set; }
    public int Player1Score { get; set; }
    public int Player2Score { get; set; }
    public int Player1EloChange { get; set; }
    public int Player2EloChange { get; set; }
    public int CurrentQuestionIndex { get; set; }
    public int Category { get; set; }
    public int Difficulty { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
}

// ── Request DTOs ─────────────────────────────────────────────────────────────

public class StartQuizDto
{
    public int Category { get; set; }
    public int Difficulty { get; set; }
}

public class SubmitAnswerDto
{
    public Guid? QuestionId { get; set; }
    public int QuestionIndex { get; set; }
    public int? SelectedOption { get; set; }
    public int TimeTakenMs { get; set; }
}

// ── SignalR Payloads ─────────────────────────────────────────────────────────

public class QuizMatchFoundPayload
{
    public Guid MatchId { get; set; }
    public QuizVsPlayerDto Opponent { get; set; } = null!;
    public int Category { get; set; }
    public int Difficulty { get; set; }
}

public class QuizQuestionPayload
{
    public int QuestionIndex { get; set; }
    public QuizQuestionDto Question { get; set; } = null!;
    public int TimerSeconds { get; set; } = 20;
}

public class QuizOpponentAnsweredPayload
{
    public Guid PlayerId { get; set; }
    public int QuestionIndex { get; set; }
}

public class QuizQuestionResultPayload
{
    public int QuestionIndex { get; set; }
    public int CorrectOption { get; set; }
    public string? Explanation { get; set; }
    public int Player1Points { get; set; }
    public int Player2Points { get; set; }
    public int Player1TotalScore { get; set; }
    public int Player2TotalScore { get; set; }
}

public class QuizMatchEndedPayload
{
    public Guid MatchId { get; set; }
    public Guid? WinnerId { get; set; }
    public string? WinnerUsername { get; set; }
    public int Player1Score { get; set; }
    public int Player2Score { get; set; }
    public int Player1EloChange { get; set; }
    public int Player2EloChange { get; set; }
    public bool IsDraw { get; set; }
}
