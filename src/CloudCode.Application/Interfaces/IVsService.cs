using CloudCode.Application.DTOs.Vs;

namespace CloudCode.Application.Interfaces;

public interface IVsService
{
    Task<VsRankDto> GetOrCreateRankAsync(Guid userId);
    Task<VsMatchDto> GetMatchAsync(Guid matchId, Guid userId);
    Task<List<VsMatchDto>> GetMatchHistoryAsync(Guid userId, int limit = 10);
    Task<List<VsLeaderboardEntryDto>> GetLeaderboardAsync(int limit = 50);
    Task<VsMatchResultDto> SubmitCodeAsync(Guid matchId, Guid userId, string code, string language);
    Task<VsMatchDto> CreateMatchAsync(Guid player1Id, Guid player2Id, string player1Language, string player2Language);
    Task CancelMatchAsync(Guid matchId, Guid requestingUserId);
}

public interface IMatchmakingService
{
    (bool matched, Guid? opponentId, string? opponentLanguage) TryEnqueue(Guid userId, string language);
    // opponentLanguage: language the opponent was queuing with (their preference)
    void Dequeue(Guid userId);
    bool IsInQueue(Guid userId);
    int QueueSize { get; }
}
