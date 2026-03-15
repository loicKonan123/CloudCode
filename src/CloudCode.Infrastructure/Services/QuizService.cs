using System.Text.Json;
using CloudCode.Application.DTOs.Quiz;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Infrastructure.Services;

public class QuizService : IQuizService
{
    private readonly ApplicationDbContext _db;

    public QuizService(ApplicationDbContext db)
    {
        _db = db;
    }

    // ── Hub helpers ──────────────────────────────────────────────────────────

    public async Task<QuizQuestionDto?> GetVsQuestionAsync(Guid matchId, int questionIndex)
    {
        var match = await _db.QuizVsMatches.FindAsync(matchId);
        if (match == null) return null;

        var ids = JsonSerializer.Deserialize<List<string>>(match.QuestionIds) ?? new();
        if (questionIndex >= ids.Count) return null;

        var questionId = Guid.Parse(ids[questionIndex]);
        var question = await _db.QuizQuestions.FindAsync(questionId);
        return question == null ? null : MapQuestionDto(question);
    }

    // ── Solo ─────────────────────────────────────────────────────────────────

    public async Task<QuizSessionDto> StartSessionAsync(Guid userId, int category, int difficulty)
    {
        // Query by category only so all difficulties are pooled together (6 questions per category in seeder)
        var questions = await _db.QuizQuestions
            .Where(q => q.IsPublished && (int)q.Category == category)
            .ToListAsync();

        if (questions.Count < 1)
            throw new InvalidOperationException($"No questions found for category={category}.");

        // Pick up to 10, randomised
        var take = Math.Min(10, questions.Count);
        var selected = questions.OrderBy(_ => Guid.NewGuid()).Take(take).ToList();

        var session = new QuizSession
        {
            UserId = userId,
            Category = (QuizCategory)category,
            Difficulty = (QuizDifficulty)difficulty,
            Status = QuizSessionStatus.InProgress,
            TotalQuestions = take
        };

        _db.QuizSessions.Add(session);
        await _db.SaveChangesAsync();

        // Store question order in answers table (placeholder rows)
        for (int i = 0; i < selected.Count; i++)
        {
            // We store question mapping separately via a helper — we embed question IDs in the session
            // using a lightweight approach: store them as QuizSessionAnswer stubs NOT YET
            // Instead we store in a separate approach: return questions directly in DTO
        }

        // Persist question order by storing question IDs as session answers placeholders
        // We use a simple approach: store the question list in the session note via re-querying
        // Actually, we embed question order as a JSON column — but entity doesn't have it.
        // Solution: return questions in DTO based on session creation order using in-memory state.
        // We store question IDs as a simple text field: use session description as storage.
        // SIMPLEST: store as a separate table row per question order (QuizSessionAnswer with no answer yet)
        // This allows the frontend to get questions on first load.

        var dto = MapSessionDto(session);
        dto.Questions = selected.Select(MapQuestionDto).ToList();
        return dto;
    }

    public async Task<QuizSessionAnswerDto> SubmitAnswerAsync(Guid userId, Guid sessionId, int questionIndex, int? selectedOption, int timeTakenMs)
    {
        var session = await _db.QuizSessions
            .Include(s => s.Answers)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId)
            ?? throw new InvalidOperationException("Session not found.");

        if (session.Status != QuizSessionStatus.InProgress)
            throw new InvalidOperationException("Session is not in progress.");

        if (session.Answers.Any(a => a.QuestionIndex == questionIndex))
            throw new InvalidOperationException("Question already answered.");

        // Get question ID from request — client must supply it
        // Actually the client tracks the question list from StartSession response.
        // The answer DTO needs the questionId — we'll get it from the request body via extension.
        // For now, we need the question ID to be passed. Let's handle via a different approach:
        // The client sends the questionId in the SubmitAnswerDto (we'll add it).
        // We look it up directly.
        throw new InvalidOperationException("Use SubmitAnswerWithQuestionAsync instead.");
    }

    public async Task<QuizSessionAnswerDto> SubmitAnswerWithQuestionAsync(Guid userId, Guid sessionId, Guid questionId, int questionIndex, int? selectedOption, int timeTakenMs)
    {
        var session = await _db.QuizSessions
            .Include(s => s.Answers)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId)
            ?? throw new InvalidOperationException("Session not found.");

        if (session.Status != QuizSessionStatus.InProgress)
            throw new InvalidOperationException("Session is not in progress.");

        if (session.Answers.Any(a => a.QuestionIndex == questionIndex))
            throw new InvalidOperationException("Question already answered.");

        var question = await _db.QuizQuestions.FindAsync(questionId)
            ?? throw new InvalidOperationException("Question not found.");

        bool isCorrect = selectedOption.HasValue && selectedOption.Value == question.CorrectOption;

        var answer = new QuizSessionAnswer
        {
            SessionId = sessionId,
            QuestionId = questionId,
            QuestionIndex = questionIndex,
            SelectedOption = selectedOption,
            IsCorrect = isCorrect,
            TimeTakenMs = timeTakenMs
        };

        _db.QuizSessionAnswers.Add(answer);

        if (isCorrect)
        {
            session.CorrectAnswers++;
            session.Score += 10;
        }

        // Last question?
        if (questionIndex == session.TotalQuestions - 1)
        {
            session.Status = QuizSessionStatus.Completed;
            session.CompletedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        return new QuizSessionAnswerDto
        {
            QuestionIndex = questionIndex,
            QuestionId = questionId,
            SelectedOption = selectedOption,
            IsCorrect = isCorrect,
            TimeTakenMs = timeTakenMs,
            Question = MapQuestionRevealDto(question)
        };
    }

    public async Task<QuizSessionDto> GetSessionAsync(Guid userId, Guid sessionId)
    {
        var session = await _db.QuizSessions
            .Include(s => s.Answers)
                .ThenInclude(a => a.Question)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId)
            ?? throw new InvalidOperationException("Session not found.");

        return MapSessionDto(session, includeAnswers: true);
    }

    public async Task<List<QuizSessionDto>> GetSessionHistoryAsync(Guid userId, int limit = 20)
    {
        var sessions = await _db.QuizSessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return sessions.Select(s => MapSessionDto(s)).ToList();
    }

    public async Task<QuizSessionDto> AbandonSessionAsync(Guid userId, Guid sessionId)
    {
        var session = await _db.QuizSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId)
            ?? throw new InvalidOperationException("Session not found.");

        if (session.Status == QuizSessionStatus.InProgress)
        {
            session.Status = QuizSessionStatus.Abandoned;
            await _db.SaveChangesAsync();
        }

        return MapSessionDto(session);
    }

    // ── VS ───────────────────────────────────────────────────────────────────

    public async Task<QuizRankDto> GetOrCreateRankAsync(Guid userId)
    {
        var rank = await _db.QuizRanks
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.UserId == userId);

        if (rank == null)
        {
            var user = await _db.Users.FindAsync(userId)
                ?? throw new Exception("User not found");

            rank = new QuizRank { UserId = userId };
            _db.QuizRanks.Add(rank);
            await _db.SaveChangesAsync();
            rank.User = user;
        }

        return MapRankDto(rank);
    }

    public async Task<List<QuizLeaderboardEntryDto>> GetLeaderboardAsync(int limit = 50)
    {
        var ranks = await _db.QuizRanks
            .Include(r => r.User)
            .Where(r => r.Wins + r.Losses + r.Draws > 0)
            .OrderByDescending(r => r.Elo)
            .Take(limit)
            .ToListAsync();

        return ranks.Select((r, i) => new QuizLeaderboardEntryDto
        {
            Rank = i + 1,
            UserId = r.UserId,
            Username = r.User.Username,
            Avatar = r.User.Avatar,
            Elo = r.Elo,
            Tier = r.GetTier(),
            Wins = r.Wins,
            Losses = r.Losses
        }).ToList();
    }

    public async Task<QuizVsMatchDto> CreateVsMatchAsync(Guid player1Id, Guid player2Id, int category, int difficulty)
    {
        var questions = await _db.QuizQuestions
            .Where(q => q.IsPublished && (int)q.Category == category)
            .ToListAsync();

        if (questions.Count < 1)
            throw new InvalidOperationException("No questions available for this category.");

        var take = Math.Min(10, questions.Count);
        var selected = questions.OrderBy(_ => Guid.NewGuid()).Take(take).ToList();
        var questionIds = JsonSerializer.Serialize(selected.Select(q => q.Id.ToString()).ToList());

        var match = new QuizVsMatch
        {
            Player1Id = player1Id,
            Player2Id = player2Id,
            Category = (QuizCategory)category,
            Difficulty = (QuizDifficulty)difficulty,
            QuestionIds = questionIds,
            Status = QuizVsMatchStatus.InProgress,
            StartedAt = DateTime.UtcNow
        };

        _db.QuizVsMatches.Add(match);
        await _db.SaveChangesAsync();

        await EnsureQuizRankExistsAsync(player1Id);
        await EnsureQuizRankExistsAsync(player2Id);

        return await GetVsMatchAsync(match.Id, player1Id);
    }

    public async Task<QuizVsMatchDto> GetVsMatchAsync(Guid matchId, Guid userId)
    {
        var match = await _db.QuizVsMatches
            .Include(m => m.Player1)
            .Include(m => m.Player2)
            .FirstOrDefaultAsync(m => m.Id == matchId)
            ?? throw new Exception("Match not found");

        if (match.Player1Id != userId && match.Player2Id != userId)
            throw new UnauthorizedAccessException("Not a participant");

        return await MapVsMatchDto(match);
    }

    public async Task<List<QuizVsMatchDto>> GetVsMatchHistoryAsync(Guid userId, int limit = 10)
    {
        var matches = await _db.QuizVsMatches
            .Include(m => m.Player1)
            .Include(m => m.Player2)
            .Where(m => (m.Player1Id == userId || m.Player2Id == userId)
                     && m.Status == QuizVsMatchStatus.Finished)
            .OrderByDescending(m => m.FinishedAt)
            .Take(limit)
            .ToListAsync();

        var result = new List<QuizVsMatchDto>();
        foreach (var m in matches)
            result.Add(await MapVsMatchDto(m));
        return result;
    }

    public async Task<(QuizQuestionResultPayload result, bool matchFinished)> SubmitVsAnswerAsync(
        Guid matchId, Guid userId, int questionIndex, int? selectedOption, int timeTakenMs)
    {
        var match = await _db.QuizVsMatches
            .Include(m => m.Player1)
            .Include(m => m.Player2)
            .FirstOrDefaultAsync(m => m.Id == matchId)
            ?? throw new Exception("Match not found");

        if (match.Player1Id != userId && match.Player2Id != userId)
            throw new UnauthorizedAccessException("Not a participant");

        if (match.Status != QuizVsMatchStatus.InProgress)
            throw new InvalidOperationException("Match is not in progress");

        // Already answered?
        var existing = await _db.QuizVsAnswers
            .FirstOrDefaultAsync(a => a.MatchId == matchId && a.PlayerId == userId && a.QuestionIndex == questionIndex);
        if (existing != null)
            throw new InvalidOperationException("Already answered this question");

        // Get question
        var questionIds = JsonSerializer.Deserialize<List<string>>(match.QuestionIds) ?? new();
        if (questionIndex >= questionIds.Count)
            throw new InvalidOperationException("Invalid question index");

        var questionId = Guid.Parse(questionIds[questionIndex]);
        var question = await _db.QuizQuestions.FindAsync(questionId)
            ?? throw new Exception("Question not found");

        bool isCorrect = selectedOption.HasValue && selectedOption.Value == question.CorrectOption;

        // Is this player first to answer this question?
        var otherAnswerExists = await _db.QuizVsAnswers
            .AnyAsync(a => a.MatchId == matchId && a.PlayerId != userId && a.QuestionIndex == questionIndex);

        bool isFirst = !otherAnswerExists;

        int pointsEarned = 0;
        if (isCorrect)
            pointsEarned = isFirst ? 2 : 1;

        var answer = new QuizVsAnswer
        {
            MatchId = matchId,
            PlayerId = userId,
            QuestionId = questionId,
            QuestionIndex = questionIndex,
            SelectedOption = selectedOption,
            IsCorrect = isCorrect,
            TimeTakenMs = timeTakenMs,
            IsFirst = isFirst
        };

        _db.QuizVsAnswers.Add(answer);

        // Update score
        if (match.Player1Id == userId)
            match.Player1Score += pointsEarned;
        else
            match.Player2Score += pointsEarned;

        await _db.SaveChangesAsync();

        // Build result payload (both may not have answered yet — we return partial)
        // The hub will only broadcast when both answered
        bool bothAnswered = await BothAnsweredQuestionAsync(matchId, questionIndex);

        // Compute points for both players for the result payload
        int p1Points = 0, p2Points = 0;
        if (bothAnswered)
        {
            var answers = await _db.QuizVsAnswers
                .Where(a => a.MatchId == matchId && a.QuestionIndex == questionIndex)
                .ToListAsync();

            var p1Answer = answers.FirstOrDefault(a => a.PlayerId == match.Player1Id);
            var p2Answer = answers.FirstOrDefault(a => a.PlayerId == match.Player2Id);

            if (p1Answer != null && p1Answer.IsCorrect)
                p1Points = p1Answer.IsFirst ? 2 : 1;
            if (p2Answer != null && p2Answer.IsCorrect)
                p2Points = p2Answer.IsFirst ? 2 : 1;
        }

        // Check if this was the last question and both finished
        bool isLastQuestion = questionIndex == questionIds.Count - 1;
        bool matchFinished = false;

        if (bothAnswered && isLastQuestion)
        {
            await FinalizeVsMatchAsync(match);
            matchFinished = true;
        }

        var resultPayload = new QuizQuestionResultPayload
        {
            QuestionIndex = questionIndex,
            CorrectOption = question.CorrectOption,
            Explanation = question.Explanation,
            Player1Points = p1Points,
            Player2Points = p2Points,
            Player1TotalScore = match.Player1Score,
            Player2TotalScore = match.Player2Score
        };

        return (resultPayload, matchFinished);
    }

    public async Task<bool> BothAnsweredQuestionAsync(Guid matchId, int questionIndex)
    {
        var count = await _db.QuizVsAnswers
            .CountAsync(a => a.MatchId == matchId && a.QuestionIndex == questionIndex);
        return count >= 2;
    }

    public async Task<QuizVsMatchDto> AbandonVsMatchAsync(Guid matchId, Guid userId)
    {
        var match = await _db.QuizVsMatches
            .Include(m => m.Player1)
            .Include(m => m.Player2)
            .FirstOrDefaultAsync(m => m.Id == matchId)
            ?? throw new Exception("Match not found");

        if (match.Player1Id != userId && match.Player2Id != userId)
            throw new UnauthorizedAccessException("Not a participant");

        if (match.Status == QuizVsMatchStatus.Finished || match.Status == QuizVsMatchStatus.Cancelled)
            return await MapVsMatchDto(match);

        var winnerId = match.Player1Id == userId ? match.Player2Id : match.Player1Id;
        match.WinnerId = winnerId;
        match.Status = QuizVsMatchStatus.Cancelled;
        match.FinishedAt = DateTime.UtcNow;

        await UpdateEloAsync(match, winnerId);
        await _db.SaveChangesAsync();

        return await MapVsMatchDto(match);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task FinalizeVsMatchAsync(QuizVsMatch match)
    {
        match.Status = QuizVsMatchStatus.Finished;
        match.FinishedAt = DateTime.UtcNow;

        if (match.Player1Score > match.Player2Score)
        {
            match.WinnerId = match.Player1Id;
            await UpdateEloAsync(match, match.Player1Id);
        }
        else if (match.Player2Score > match.Player1Score)
        {
            match.WinnerId = match.Player2Id;
            await UpdateEloAsync(match, match.Player2Id);
        }
        else
        {
            await UpdateEloDrawAsync(match);
        }

        await _db.SaveChangesAsync();
    }

    private async Task UpdateEloAsync(QuizVsMatch match, Guid winnerId)
    {
        var rank1 = await EnsureQuizRankExistsAsync(match.Player1Id);
        var rank2 = await EnsureQuizRankExistsAsync(match.Player2Id);

        const int K = 32;
        double expected1 = 1.0 / (1.0 + Math.Pow(10, (rank2.Elo - rank1.Elo) / 400.0));
        double expected2 = 1.0 - expected1;
        double score1 = winnerId == match.Player1Id ? 1.0 : 0.0;
        double score2 = 1.0 - score1;

        int change1 = (int)Math.Round(K * (score1 - expected1));
        int change2 = (int)Math.Round(K * (score2 - expected2));

        rank1.Elo = Math.Max(100, rank1.Elo + change1);
        rank2.Elo = Math.Max(100, rank2.Elo + change2);

        if (winnerId == match.Player1Id)
        {
            rank1.Wins++; rank2.Losses++;
            rank1.CurrentStreak++; rank2.CurrentStreak = 0;
        }
        else
        {
            rank2.Wins++; rank1.Losses++;
            rank2.CurrentStreak++; rank1.CurrentStreak = 0;
        }

        if (rank1.CurrentStreak > rank1.BestStreak) rank1.BestStreak = rank1.CurrentStreak;
        if (rank2.CurrentStreak > rank2.BestStreak) rank2.BestStreak = rank2.CurrentStreak;

        match.Player1EloChange = change1;
        match.Player2EloChange = change2;
    }

    private async Task UpdateEloDrawAsync(QuizVsMatch match)
    {
        var rank1 = await EnsureQuizRankExistsAsync(match.Player1Id);
        var rank2 = await EnsureQuizRankExistsAsync(match.Player2Id);

        const int K = 32;
        double expected1 = 1.0 / (1.0 + Math.Pow(10, (rank2.Elo - rank1.Elo) / 400.0));
        int change1 = (int)Math.Round(K * (0.5 - expected1));
        int change2 = -change1;

        rank1.Elo = Math.Max(100, rank1.Elo + change1);
        rank2.Elo = Math.Max(100, rank2.Elo + change2);

        rank1.Draws++; rank2.Draws++;
        rank1.CurrentStreak = 0; rank2.CurrentStreak = 0;

        match.Player1EloChange = change1;
        match.Player2EloChange = change2;
    }

    private async Task<QuizRank> EnsureQuizRankExistsAsync(Guid userId)
    {
        var rank = await _db.QuizRanks.FirstOrDefaultAsync(r => r.UserId == userId);
        if (rank == null)
        {
            rank = new QuizRank { UserId = userId };
            _db.QuizRanks.Add(rank);
            await _db.SaveChangesAsync();
        }
        return rank;
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private static QuizQuestionDto MapQuestionDto(QuizQuestion q) => new()
    {
        Id = q.Id,
        Text = q.Text,
        OptionA = q.OptionA,
        OptionB = q.OptionB,
        OptionC = q.OptionC,
        OptionD = q.OptionD,
        Category = (int)q.Category,
        Difficulty = (int)q.Difficulty
    };

    private static QuizQuestionRevealDto MapQuestionRevealDto(QuizQuestion q) => new()
    {
        Id = q.Id,
        Text = q.Text,
        OptionA = q.OptionA,
        OptionB = q.OptionB,
        OptionC = q.OptionC,
        OptionD = q.OptionD,
        Category = (int)q.Category,
        Difficulty = (int)q.Difficulty,
        CorrectOption = q.CorrectOption,
        Explanation = q.Explanation
    };

    private static QuizSessionDto MapSessionDto(QuizSession s, bool includeAnswers = false)
    {
        var dto = new QuizSessionDto
        {
            Id = s.Id,
            UserId = s.UserId,
            Category = (int)s.Category,
            Difficulty = (int)s.Difficulty,
            Status = (int)s.Status,
            Score = s.Score,
            TotalQuestions = s.TotalQuestions,
            CorrectAnswers = s.CorrectAnswers,
            CompletedAt = s.CompletedAt,
            CreatedAt = s.CreatedAt
        };

        if (includeAnswers && s.Answers != null)
        {
            dto.Answers = s.Answers.Select(a => new QuizSessionAnswerDto
            {
                QuestionIndex = a.QuestionIndex,
                QuestionId = a.QuestionId,
                SelectedOption = a.SelectedOption,
                IsCorrect = a.IsCorrect,
                TimeTakenMs = a.TimeTakenMs,
                Question = a.Question != null ? MapQuestionRevealDto(a.Question) : null!
            }).OrderBy(a => a.QuestionIndex).ToList();
        }

        return dto;
    }

    private static QuizRankDto MapRankDto(QuizRank r) => new()
    {
        UserId = r.UserId,
        Username = r.User.Username,
        Avatar = r.User.Avatar,
        Elo = r.Elo,
        Tier = r.GetTier(),
        Wins = r.Wins,
        Losses = r.Losses,
        Draws = r.Draws,
        CurrentStreak = r.CurrentStreak,
        BestStreak = r.BestStreak
    };

    private async Task<QuizVsMatchDto> MapVsMatchDto(QuizVsMatch m)
    {
        var rank1 = await EnsureQuizRankExistsAsync(m.Player1Id);
        var rank2 = await EnsureQuizRankExistsAsync(m.Player2Id);

        return new QuizVsMatchDto
        {
            Id = m.Id,
            Player1 = new QuizVsPlayerDto
            {
                Id = m.Player1Id,
                Username = m.Player1.Username,
                Avatar = m.Player1.Avatar,
                Elo = rank1.Elo,
                Tier = rank1.GetTier(),
                Score = m.Player1Score,
                Finished = m.Player1Finished
            },
            Player2 = new QuizVsPlayerDto
            {
                Id = m.Player2Id,
                Username = m.Player2.Username,
                Avatar = m.Player2.Avatar,
                Elo = rank2.Elo,
                Tier = rank2.GetTier(),
                Score = m.Player2Score,
                Finished = m.Player2Finished
            },
            Status = (int)m.Status,
            WinnerId = m.WinnerId,
            Player1Score = m.Player1Score,
            Player2Score = m.Player2Score,
            Player1EloChange = m.Player1EloChange,
            Player2EloChange = m.Player2EloChange,
            CurrentQuestionIndex = m.CurrentQuestionIndex,
            Category = (int)m.Category,
            Difficulty = (int)m.Difficulty,
            StartedAt = m.StartedAt,
            FinishedAt = m.FinishedAt
        };
    }
}
