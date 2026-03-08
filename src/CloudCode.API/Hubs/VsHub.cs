using System.Security.Claims;
using CloudCode.Application.DTOs.Vs;
using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CloudCode.Hubs;

[Authorize]
public class VsHub : Hub
{
    private readonly IMatchmakingService _matchmaking;
    private readonly IVsService _vsService;

    public VsHub(IMatchmakingService matchmaking, IVsService vsService)
    {
        _matchmaking = matchmaking;
        _vsService = vsService;
    }

    private Guid GetUserId()
    {
        var claim = Context.User?.FindFirst("userId") ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    // ── Matchmaking ───────────────────────────────────────────────────────────

    /// <summary>Called by client to join the matchmaking queue.</summary>
    public async Task JoinQueue(string language = "python")
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return;

        var (matched, opponentId) = _matchmaking.TryEnqueue(userId, language);

        if (matched && opponentId.HasValue)
        {
            // Create match in DB
            var match = await _vsService.CreateMatchAsync(userId, opponentId.Value, language);

            // Build payloads for each player
            var payloadForPlayer1 = new MatchFoundPayload
            {
                MatchId = match.Id,
                Opponent = match.Player2,
                ChallengeSlug = match.ChallengeSlug,
                ChallengeTitle = match.ChallengeTitle,
                Language = match.Language
            };
            var payloadForPlayer2 = new MatchFoundPayload
            {
                MatchId = match.Id,
                Opponent = match.Player1,
                ChallengeSlug = match.ChallengeSlug,
                ChallengeTitle = match.ChallengeTitle,
                Language = match.Language
            };

            // Notify the caller (player1 = just joined)
            await Clients.Caller.SendAsync("MatchFound", payloadForPlayer1);

            // Notify the opponent
            await Clients.User(opponentId.Value.ToString()).SendAsync("MatchFound", payloadForPlayer2);
        }
        else
        {
            // Tell client they're in queue
            await Clients.Caller.SendAsync("QueueJoined", _matchmaking.QueueSize);
        }
    }

    /// <summary>Leave the matchmaking queue.</summary>
    public Task LeaveQueue()
    {
        var userId = GetUserId();
        _matchmaking.Dequeue(userId);
        return Task.CompletedTask;
    }

    // ── Match room ────────────────────────────────────────────────────────────

    /// <summary>Join a specific match's SignalR group for real-time updates.</summary>
    public async Task JoinMatchRoom(string matchId)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return;

        if (!Guid.TryParse(matchId, out var matchGuid)) return;

        // Verify participant
        try
        {
            await _vsService.GetMatchAsync(matchGuid, userId);
        }
        catch
        {
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"match-{matchId}");
        await Clients.Caller.SendAsync("JoinedMatchRoom", matchId);
    }

    /// <summary>Notify group that a player submitted (without revealing result yet).</summary>
    public async Task NotifySubmitting(string matchId)
    {
        var userId = GetUserId();
        var group = $"match-{matchId}";

        await Clients.OthersInGroup(group).SendAsync("OpponentStatus", new OpponentStatusPayload
        {
            PlayerId = userId,
            Event = "submitting"
        });
    }

    /// <summary>
    /// Called after judge returns — broadcasts result to the match group.
    /// The actual submission is done via HTTP (VsController), this is called
    /// server-side to notify the group.
    /// </summary>
    public async Task BroadcastMatchResult(string matchId, MatchEndedPayload payload)
    {
        // Only called internally — verify caller is a participant
        var userId = GetUserId();
        if (!Guid.TryParse(matchId, out var matchGuid)) return;

        try { await _vsService.GetMatchAsync(matchGuid, userId); }
        catch { return; }

        await Clients.Group($"match-{matchId}").SendAsync("MatchEnded", payload);
    }

    // ── Connection lifecycle ──────────────────────────────────────────────────

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        _matchmaking.Dequeue(userId);
        return base.OnDisconnectedAsync(exception);
    }
}
