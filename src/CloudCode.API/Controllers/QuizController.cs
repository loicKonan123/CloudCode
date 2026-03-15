using CloudCode.Application.DTOs.Quiz;
using CloudCode.Application.Interfaces;
using CloudCode.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

[Authorize]
public class QuizController : BaseApiController
{
    private readonly IQuizService _quizService;
    private readonly IPremiumService _premiumService;

    public QuizController(IQuizService quizService, IPremiumService premiumService)
    {
        _quizService = quizService;
        _premiumService = premiumService;
    }

    // ── Solo Quiz ────────────────────────────────────────────────────────────

    /// <summary>Start a new solo quiz session.</summary>
    [HttpPost("sessions")]
    public async Task<ActionResult<QuizSessionDto>> StartSession([FromBody] StartQuizDto dto)
    {
        var userId = GetRequiredUserId();
        if (!await _premiumService.IsPremiumActiveAsync(userId))
            return StatusCode(402, new { message = "Premium required to access Quiz." });

        try
        {
            var session = await _quizService.StartSessionAsync(userId, dto.Category, dto.Difficulty);
            return Ok(session);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Get a solo session by ID.</summary>
    [HttpGet("sessions/{sessionId:guid}")]
    public async Task<ActionResult<QuizSessionDto>> GetSession(Guid sessionId)
    {
        var userId = GetRequiredUserId();
        try
        {
            return Ok(await _quizService.GetSessionAsync(userId, sessionId));
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    /// <summary>Get solo session history.</summary>
    [HttpGet("sessions")]
    public async Task<ActionResult<List<QuizSessionDto>>> GetSessionHistory()
    {
        var userId = GetRequiredUserId();
        return Ok(await _quizService.GetSessionHistoryAsync(userId));
    }

    /// <summary>Submit an answer for a solo quiz question.</summary>
    [HttpPost("sessions/{sessionId:guid}/answers")]
    public async Task<ActionResult<QuizSessionAnswerDto>> SubmitAnswer(Guid sessionId, [FromBody] SubmitAnswerDto dto)
    {
        var userId = GetRequiredUserId();

        if (!dto.QuestionId.HasValue)
            return BadRequest(new { message = "QuestionId is required." });

        try
        {
            var result = await ((QuizService)_quizService).SubmitAnswerWithQuestionAsync(
                userId, sessionId, dto.QuestionId.Value, dto.QuestionIndex, dto.SelectedOption, dto.TimeTakenMs);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Abandon a solo session.</summary>
    [HttpPost("sessions/{sessionId:guid}/abandon")]
    public async Task<ActionResult<QuizSessionDto>> AbandonSession(Guid sessionId)
    {
        var userId = GetRequiredUserId();
        return Ok(await _quizService.AbandonSessionAsync(userId, sessionId));
    }

    // ── Quiz VS ──────────────────────────────────────────────────────────────

    /// <summary>Get current user's quiz VS rank.</summary>
    [HttpGet("vs/rank")]
    public async Task<ActionResult<QuizRankDto>> GetMyRank()
    {
        var userId = GetRequiredUserId();
        return Ok(await _quizService.GetOrCreateRankAsync(userId));
    }

    /// <summary>Get a specific user's quiz VS rank.</summary>
    [HttpGet("vs/rank/{userId:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<QuizRankDto>> GetRank(Guid userId)
    {
        return Ok(await _quizService.GetOrCreateRankAsync(userId));
    }

    /// <summary>Get quiz VS leaderboard.</summary>
    [HttpGet("vs/leaderboard")]
    [AllowAnonymous]
    public async Task<ActionResult<List<QuizLeaderboardEntryDto>>> GetLeaderboard()
    {
        return Ok(await _quizService.GetLeaderboardAsync());
    }

    /// <summary>Get current user's quiz VS match history.</summary>
    [HttpGet("vs/matches")]
    public async Task<ActionResult<List<QuizVsMatchDto>>> GetVsHistory()
    {
        var userId = GetRequiredUserId();
        return Ok(await _quizService.GetVsMatchHistoryAsync(userId));
    }

    /// <summary>Get a quiz VS match by ID.</summary>
    [HttpGet("vs/matches/{matchId:guid}")]
    public async Task<ActionResult<QuizVsMatchDto>> GetVsMatch(Guid matchId)
    {
        var userId = GetRequiredUserId();
        try
        {
            return Ok(await _quizService.GetVsMatchAsync(matchId, userId));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>Abandon / forfeit a quiz VS match.</summary>
    [HttpPost("vs/matches/{matchId:guid}/abandon")]
    public async Task<ActionResult<QuizVsMatchDto>> AbandonVsMatch(Guid matchId)
    {
        var userId = GetRequiredUserId();
        try
        {
            return Ok(await _quizService.AbandonVsMatchAsync(matchId, userId));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
