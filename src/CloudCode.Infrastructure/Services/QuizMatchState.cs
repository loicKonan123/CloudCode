using System.Collections.Concurrent;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Tracks in-memory per-match per-question state to handle race conditions
/// when both players submit answers simultaneously.
/// </summary>
public class QuizMatchState
{
    // matchId_questionIndex → set of playerIds who answered
    private readonly ConcurrentDictionary<string, HashSet<Guid>> _answers = new();
    // matchId_questionIndex → true if result was already broadcast
    private readonly ConcurrentDictionary<string, bool> _closed = new();
    // matchId → true if first question was already sent
    private readonly ConcurrentDictionary<string, bool> _firstQuestionSent = new();

    private static string Key(Guid matchId, int questionIndex) => $"{matchId}_{questionIndex}";

    /// <summary>
    /// Records that a player answered a question.
    /// Returns true if this is the FIRST answer recorded for this player+question.
    /// </summary>
    public bool TryRecordAnswer(Guid matchId, Guid playerId, int questionIndex)
    {
        var key = Key(matchId, questionIndex);
        var set = _answers.GetOrAdd(key, _ => new HashSet<Guid>());

        lock (set)
        {
            return set.Add(playerId); // false if already added
        }
    }

    /// <summary>
    /// Returns true if both players have answered this question.
    /// </summary>
    public bool BothAnswered(Guid matchId, int questionIndex, int expectedPlayers = 2)
    {
        var key = Key(matchId, questionIndex);
        if (!_answers.TryGetValue(key, out var set)) return false;
        lock (set)
        {
            return set.Count >= expectedPlayers;
        }
    }

    /// <summary>
    /// Marks a question result as already broadcast (idempotent).
    /// Returns true if this is the first time CloseQuestion is called.
    /// </summary>
    public bool CloseQuestion(Guid matchId, int questionIndex)
    {
        var key = Key(matchId, questionIndex);
        return _closed.TryAdd(key, true);
    }

    /// <summary>
    /// Marks that the first question has been sent for this match.
    /// Returns true only the first time (idempotent).
    /// </summary>
    public bool TryMarkFirstQuestionSent(Guid matchId)
        => _firstQuestionSent.TryAdd(matchId.ToString(), true);

    /// <summary>
    /// Cleans up all state for a match when it ends.
    /// </summary>
    public void RemoveMatch(Guid matchId)
    {
        var prefix = matchId.ToString();
        foreach (var key in _answers.Keys.Where(k => k.StartsWith(prefix)))
            _answers.TryRemove(key, out _);
        foreach (var key in _closed.Keys.Where(k => k.StartsWith(prefix)))
            _closed.TryRemove(key, out _);
        _firstQuestionSent.TryRemove(prefix, out _);
    }
}
