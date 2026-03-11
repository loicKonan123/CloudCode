using CloudCode.Application.DTOs.Challenges;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CloudCode.Controllers;

[Authorize]
public class ChallengesController : BaseApiController
{
    private readonly IChallengeService _challengeService;
    private readonly IJudgeService _judgeService;

    public ChallengesController(IChallengeService challengeService, IJudgeService judgeService)
    {
        _challengeService = challengeService;
        _judgeService = judgeService;
    }

    /// <summary>
    /// Get all published challenges with optional filters.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<ChallengeListItemDto>>> GetChallenges(
        [FromQuery] ChallengeDifficulty? difficulty,
        [FromQuery] ChallengeLanguage? language)
    {
        var challenges = await _challengeService.GetPublishedChallengesAsync(CurrentUserId, difficulty, language);
        return Ok(challenges);
    }

    /// <summary>
    /// Get today's daily challenge.
    /// </summary>
    [HttpGet("daily")]
    [AllowAnonymous]
    public async Task<ActionResult<ChallengeListItemDto>> GetDaily()
    {
        var daily = await _challengeService.GetDailyChallengeAsync(CurrentUserId);
        if (daily == null) return NotFound();
        return Ok(daily);
    }

    /// <summary>
    /// Get challenge detail by slug.
    /// </summary>
    [HttpGet("{slug}")]
    [AllowAnonymous]
    public async Task<ActionResult<ChallengeDetailDto>> GetBySlug(string slug)
    {
        var challenge = await _challengeService.GetBySlugAsync(slug, CurrentUserId);
        if (challenge == null) return NotFound();
        return Ok(challenge);
    }

    /// <summary>
    /// Test code against visible test cases only.
    /// </summary>
    [HttpPost("{slug}/test")]
    [EnableRateLimiting("test")]
    public async Task<ActionResult<JudgeResultDto>> TestCode(string slug, [FromBody] SubmitCodeDto dto)
    {
        var challenge = await _challengeService.GetBySlugAsync(slug, null);
        if (challenge == null) return NotFound();

        var result = await _judgeService.RunTestsAsync(challenge.Id, dto.Code, dto.Language, visibleOnly: true);
        return Ok(result);
    }

    /// <summary>
    /// Submit code — runs all test cases and saves score.
    /// </summary>
    [HttpPost("{slug}/submit")]
    [EnableRateLimiting("submit")]
    public async Task<ActionResult<JudgeResultDto>> SubmitCode(string slug, [FromBody] SubmitCodeDto dto)
    {
        var userId = GetRequiredUserId();
        var challenge = await _challengeService.GetBySlugAsync(slug, null);
        if (challenge == null) return NotFound();

        var result = await _judgeService.SubmitAsync(challenge.Id, userId, dto.Code, dto.Language);
        return Ok(result);
    }

    /// <summary>
    /// Get user's submissions for a challenge.
    /// </summary>
    [HttpGet("{slug}/submissions")]
    public async Task<ActionResult<List<SubmissionDto>>> GetSubmissions(string slug)
    {
        var userId = GetRequiredUserId();
        var submissions = await _challengeService.GetUserSubmissionsAsync(slug, userId);
        return Ok(submissions);
    }

    /// <summary>
    /// Get leaderboard.
    /// </summary>
    [HttpGet("/api/leaderboard")]
    [AllowAnonymous]
    public async Task<ActionResult<LeaderboardPageDto>> GetLeaderboard(
        [FromQuery] string period = "all",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _challengeService.GetLeaderboardAsync(period, page, pageSize);
        return Ok(result);
    }
}
