using CloudCode.Application.DTOs.Vs;
using CloudCode.Application.Interfaces;
using CloudCode.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace CloudCode.Controllers;

[Authorize]
public class VsController : BaseApiController
{
    private readonly IVsService _vsService;
    private readonly IHubContext<VsHub> _vsHub;
    private readonly IPremiumService _premiumService;

    public VsController(IVsService vsService, IHubContext<VsHub> vsHub, IPremiumService premiumService)
    {
        _vsService = vsService;
        _vsHub = vsHub;
        _premiumService = premiumService;
    }

    /// <summary>Get the current user's VS rank.</summary>
    [HttpGet("rank")]
    public async Task<ActionResult<VsRankDto>> GetMyRank()
    {
        var userId = GetRequiredUserId();
        if (!await _premiumService.IsPremiumActiveAsync(userId))
            return StatusCode(402, new { message = "Premium required to access VS Mode." });

        var rank = await _vsService.GetOrCreateRankAsync(userId);
        return Ok(rank);
    }

    /// <summary>Get a specific user's rank by userId.</summary>
    [HttpGet("rank/{userId:guid}")]
    public async Task<ActionResult<VsRankDto>> GetRank(Guid userId)
    {
        var rank = await _vsService.GetOrCreateRankAsync(userId);
        return Ok(rank);
    }

    /// <summary>Get VS leaderboard.</summary>
    [HttpGet("leaderboard")]
    [AllowAnonymous]
    public async Task<ActionResult<List<VsLeaderboardEntryDto>>> GetLeaderboard()
    {
        var board = await _vsService.GetLeaderboardAsync();
        return Ok(board);
    }

    /// <summary>Get a match by ID.</summary>
    [HttpGet("matches/{matchId:guid}")]
    public async Task<ActionResult<VsMatchDto>> GetMatch(Guid matchId)
    {
        var userId = GetRequiredUserId();
        try
        {
            var match = await _vsService.GetMatchAsync(matchId, userId);
            return Ok(match);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>Get current user's match history.</summary>
    [HttpGet("matches")]
    public async Task<ActionResult<List<VsMatchDto>>> GetHistory()
    {
        var userId = GetRequiredUserId();
        var history = await _vsService.GetMatchHistoryAsync(userId);
        return Ok(history);
    }

    /// <summary>
    /// Submit code for a VS match.
    /// Runs judge, updates match state, and broadcasts result via SignalR.
    /// </summary>
    [HttpPost("matches/{matchId:guid}/submit")]
    public async Task<ActionResult<VsMatchResultDto>> Submit(Guid matchId, [FromBody] VsSubmitDto dto)
    {
        var userId = GetRequiredUserId();

        try
        {
            var result = await _vsService.SubmitCodeAsync(matchId, userId, dto.Code, dto.Language);

            // Reload match to check if it finished
            var match = await _vsService.GetMatchAsync(matchId, userId);

            if (match.Status == Domain.Enums.VsMatchStatus.Finished ||
                match.Status == Domain.Enums.VsMatchStatus.Cancelled)
            {
                // Broadcast match ended to the group
                var payload = new MatchEndedPayload
                {
                    MatchId = matchId,
                    WinnerId = match.WinnerId,
                    WinnerUsername = match.WinnerId == match.Player1.Id
                        ? match.Player1.Username
                        : match.WinnerId == match.Player2.Id
                            ? match.Player2.Username
                            : null,
                    Player1EloChange = match.Player1EloChange,
                    Player2EloChange = match.Player2EloChange,
                    IsDraw = match.WinnerId == null
                };
                await _vsHub.Clients.Group($"match-{matchId}").SendAsync("MatchEnded", payload);
            }
            else
            {
                // Notify opponent that this player submitted
                var opponentStatus = new OpponentStatusPayload
                {
                    PlayerId = userId,
                    Event = result.Passed ? "passed" : "failed"
                };
                await _vsHub.Clients.Group($"match-{matchId}").SendAsync("OpponentStatus", opponentStatus);
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>Forfeit / cancel a match.</summary>
    [HttpPost("matches/{matchId:guid}/forfeit")]
    public async Task<ActionResult> Forfeit(Guid matchId)
    {
        var userId = GetRequiredUserId();

        try
        {
            await _vsService.CancelMatchAsync(matchId, userId);

            var match = await _vsService.GetMatchAsync(matchId, userId);
            var payload = new MatchEndedPayload
            {
                MatchId = matchId,
                WinnerId = match.WinnerId,
                WinnerUsername = match.WinnerId == match.Player1.Id
                    ? match.Player1.Username
                    : match.Player2.Username,
                Player1EloChange = match.Player1EloChange,
                Player2EloChange = match.Player2EloChange,
                IsDraw = false
            };
            await _vsHub.Clients.Group($"match-{matchId}").SendAsync("MatchEnded", payload);

            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
