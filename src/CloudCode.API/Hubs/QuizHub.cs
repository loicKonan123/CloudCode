using System.Security.Claims;
using System.Text.Json;
using CloudCode.Application.DTOs.Quiz;
using CloudCode.Application.Interfaces;
using CloudCode.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CloudCode.Hubs;

[Authorize]
public class QuizHub : Hub
{
    private readonly IQuizMatchmakingService _matchmaking;
    private readonly IQuizService _quizService;
    private readonly QuizMatchState _state;

    public QuizHub(IQuizMatchmakingService matchmaking, IQuizService quizService, QuizMatchState state)
    {
        _matchmaking = matchmaking;
        _quizService = quizService;
        _state = state;
    }

    private Guid GetUserId()
    {
        var claim = Context.User?.FindFirst("userId") ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    // ── Matchmaking ───────────────────────────────────────────────────────────

    public async Task JoinQueue(int category, int difficulty)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return;

        var (matched, opponentId, opponentCategory, opponentDifficulty) =
            _matchmaking.TryEnqueue(userId, category, difficulty);

        if (matched && opponentId.HasValue)
        {
            var match = await _quizService.CreateVsMatchAsync(userId, opponentId.Value, category, difficulty);

            var myRank = await _quizService.GetOrCreateRankAsync(userId);
            var opponentRank = await _quizService.GetOrCreateRankAsync(opponentId.Value);

            var payloadForCaller = new QuizMatchFoundPayload
            {
                MatchId = match.Id,
                Opponent = match.Player2, // caller = player1
                Category = category,
                Difficulty = difficulty
            };

            var payloadForOpponent = new QuizMatchFoundPayload
            {
                MatchId = match.Id,
                Opponent = match.Player1,
                Category = category,
                Difficulty = difficulty
            };

            await Clients.Caller.SendAsync("MatchFound", payloadForCaller);
            await Clients.User(opponentId.Value.ToString()).SendAsync("MatchFound", payloadForOpponent);
        }
        else
        {
            await Clients.Caller.SendAsync("QueueJoined", _matchmaking.QueueSize);
        }
    }

    public Task LeaveQueue()
    {
        var userId = GetUserId();
        _matchmaking.Dequeue(userId);
        return Task.CompletedTask;
    }

    // ── Match Room ────────────────────────────────────────────────────────────

    public async Task JoinMatchRoom(string matchId)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty || !Guid.TryParse(matchId, out var matchGuid)) return;

        QuizVsMatchDto match;
        try { match = await _quizService.GetVsMatchAsync(matchGuid, userId); }
        catch { return; }

        var groupName = $"quiz-match-{matchId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Clients.Caller.SendAsync("JoinedMatchRoom", matchId);

        // Send first question only once (not once per player joining)
        if (_state.TryMarkFirstQuestionSent(matchGuid))
            await SendQuestion(matchGuid, 0);
    }

    public async Task SubmitVsAnswer(string matchId, int questionIndex, int? selectedOption, int timeTakenMs)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty || !Guid.TryParse(matchId, out var matchGuid)) return;

        // Idempotency check via in-memory state
        if (!_state.TryRecordAnswer(matchGuid, userId, questionIndex))
            return; // Already recorded

        try
        {
            var (resultPayload, matchFinished) = await _quizService.SubmitVsAnswerAsync(
                matchGuid, userId, questionIndex, selectedOption, timeTakenMs);

            var groupName = $"quiz-match-{matchId}";

            // Notify opponent that this player answered (not revealing the answer)
            await Clients.OthersInGroup(groupName).SendAsync("OpponentAnswered", new QuizOpponentAnsweredPayload
            {
                PlayerId = userId,
                QuestionIndex = questionIndex
            });

            // If both answered, broadcast result then advance
            if (_state.BothAnswered(matchGuid, questionIndex))
            {
                // Only broadcast once (first thread to get here)
                if (_state.CloseQuestion(matchGuid, questionIndex))
                {
                    await Clients.Group(groupName).SendAsync("QuestionResult", resultPayload);

                    if (matchFinished)
                    {
                        var match = await _quizService.GetVsMatchAsync(matchGuid, userId);
                        var endPayload = new QuizMatchEndedPayload
                        {
                            MatchId = matchGuid,
                            WinnerId = match.WinnerId,
                            WinnerUsername = match.WinnerId == match.Player1.Id
                                ? match.Player1.Username
                                : match.WinnerId == match.Player2.Id
                                    ? match.Player2.Username
                                    : null,
                            Player1Score = match.Player1Score,
                            Player2Score = match.Player2Score,
                            Player1EloChange = match.Player1EloChange,
                            Player2EloChange = match.Player2EloChange,
                            IsDraw = match.WinnerId == null
                        };
                        _state.RemoveMatch(matchGuid);
                        await Clients.Group(groupName).SendAsync("MatchEnded", endPayload);
                    }
                    else
                    {
                        // Next question after 3 second delay
                        await Task.Delay(3000);
                        await SendQuestion(matchGuid, questionIndex + 1);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task SendQuestion(Guid matchId, int questionIndex)
    {
        try
        {
            var question = await ((QuizService)_quizService).GetVsQuestionAsync(matchId, questionIndex);
            if (question == null) return;

            var payload = new QuizQuestionPayload
            {
                QuestionIndex = questionIndex,
                Question = question,
                TimerSeconds = 20
            };

            await Clients.Group($"quiz-match-{matchId}").SendAsync("Question", payload);
        }
        catch { /* match may have ended */ }
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        _matchmaking.Dequeue(userId);
        return base.OnDisconnectedAsync(exception);
    }
}
