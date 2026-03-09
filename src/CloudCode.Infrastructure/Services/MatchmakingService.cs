using System.Collections.Concurrent;
using CloudCode.Application.Interfaces;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Singleton in-memory matchmaking queue.
/// Matches any two waiting players regardless of language —
/// each player codes in their own chosen language.
/// </summary>
public class MatchmakingService : IMatchmakingService
{
    private record QueueEntry(Guid UserId, string Language, DateTime JoinedAt);

    private readonly List<QueueEntry> _queue = new();
    private readonly object _lock = new();

    public int QueueSize { get { lock (_lock) return _queue.Count; } }

    public (bool matched, Guid? opponentId, string? opponentLanguage) TryEnqueue(Guid userId, string language)
    {
        lock (_lock)
        {
            // Already in queue?
            if (_queue.Any(e => e.UserId == userId))
                return (false, null, null);

            // Match any waiting player — each uses their own language
            var opponent = _queue.FirstOrDefault(e => e.UserId != userId);

            if (opponent != null)
            {
                _queue.Remove(opponent);
                return (true, opponent.UserId, opponent.Language);
            }

            // No match — join queue
            _queue.Add(new QueueEntry(userId, language, DateTime.UtcNow));
            return (false, null, null);
        }
    }

    public void Dequeue(Guid userId)
    {
        lock (_lock)
        {
            _queue.RemoveAll(e => e.UserId == userId);
        }
    }

    public bool IsInQueue(Guid userId)
    {
        lock (_lock) return _queue.Any(e => e.UserId == userId);
    }
}
