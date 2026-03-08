using CloudCode.Application.DTOs.Vs;

namespace CloudCode.Application.Interfaces;

public interface IVsService
{
    Task<VsRankDto> GetOrCreateRankAsync(Guid userId);
    Task<VsMatchDto> GetMatchAsync(Guid matchId, Guid userId);
    Task<List<VsMatchDto>> GetMatchHistoryAsync(Guid userId, int limit = 10);
    Task<List<VsLeaderboardEntryDto>> GetLeaderboardAsync(int limit = 50);
    Task<VsMatchResultDto> SubmitCodeAsync(Guid matchId, Guid userId, string code, string language);
    Task<VsMatchDto> CreateMatchAsync(Guid player1Id, Guid player2Id, string language);
    Task CancelMatchAsync(Guid matchId, Guid requestingUserId);
}

public interface IMatchmakingService
{
    // Returns true and the matched userId if a match was found
    (bool matched, Guid? opponentId) TryEnqueue(Guid userId, string language);
    void Dequeue(Guid userId);
    bool IsInQueue(Guid userId);
    int QueueSize { get; }
}
