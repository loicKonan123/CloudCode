using CloudCode.Application.DTOs.Challenges;
using CloudCode.Domain.Enums;

namespace CloudCode.Application.Interfaces;

public interface IChallengeService
{
    // Public
    Task<List<ChallengeListItemDto>> GetPublishedChallengesAsync(
        Guid? userId, ChallengeDifficulty? difficulty = null, ChallengeLanguage? language = null);
    Task<ChallengeDetailDto?> GetBySlugAsync(string slug, Guid? userId);
    Task<List<SubmissionDto>> GetUserSubmissionsAsync(string slug, Guid userId);

    // Admin
    Task<List<ChallengeListItemDto>> GetAllChallengesAsync();
    Task<ChallengeDetailDto> CreateChallengeAsync(CreateChallengeDto dto);
    Task<ChallengeDetailDto> UpdateChallengeAsync(Guid id, UpdateChallengeDto dto);
    Task DeleteChallengeAsync(Guid id);
    Task<ChallengeDetailDto> TogglePublishAsync(Guid id);

    // Leaderboard
    Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(string period = "all");
}
