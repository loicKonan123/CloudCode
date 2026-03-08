using CloudCode.Application.DTOs.Challenges;
using CloudCode.Domain.Enums;

namespace CloudCode.Application.Interfaces;

public interface IJudgeService
{
    Task<JudgeResultDto> RunTestsAsync(Guid challengeId, string code, ChallengeLanguage language, bool visibleOnly);
    Task<JudgeResultDto> SubmitAsync(Guid challengeId, Guid userId, string code, ChallengeLanguage language);
}
