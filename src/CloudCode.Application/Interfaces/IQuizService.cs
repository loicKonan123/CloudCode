using CloudCode.Application.DTOs.Quiz;

namespace CloudCode.Application.Interfaces;

public interface IQuizService
{
    // Solo
    Task<QuizSessionDto> StartSessionAsync(Guid userId, int category, int difficulty);
    Task<QuizSessionAnswerDto> SubmitAnswerAsync(Guid userId, Guid sessionId, int questionIndex, int? selectedOption, int timeTakenMs);
    Task<QuizSessionDto> GetSessionAsync(Guid userId, Guid sessionId);
    Task<List<QuizSessionDto>> GetSessionHistoryAsync(Guid userId, int limit = 20);
    Task<QuizSessionDto> AbandonSessionAsync(Guid userId, Guid sessionId);

    // VS
    Task<QuizRankDto> GetOrCreateRankAsync(Guid userId);
    Task<List<QuizLeaderboardEntryDto>> GetLeaderboardAsync(int limit = 50);
    Task<QuizVsMatchDto> CreateVsMatchAsync(Guid player1Id, Guid player2Id, int category, int difficulty);
    Task<QuizVsMatchDto> GetVsMatchAsync(Guid matchId, Guid userId);
    Task<List<QuizVsMatchDto>> GetVsMatchHistoryAsync(Guid userId, int limit = 10);
    Task<(QuizQuestionResultPayload result, bool matchFinished)> SubmitVsAnswerAsync(Guid matchId, Guid userId, int questionIndex, int? selectedOption, int timeTakenMs);
    Task<bool> BothAnsweredQuestionAsync(Guid matchId, int questionIndex);
    Task<QuizVsMatchDto> AbandonVsMatchAsync(Guid matchId, Guid userId);
}

public interface IQuizMatchmakingService
{
    (bool matched, Guid? opponentId, int? opponentCategory, int? opponentDifficulty) TryEnqueue(Guid userId, int category, int difficulty);
    void Dequeue(Guid userId);
    bool IsInQueue(Guid userId);
    int QueueSize { get; }
}
