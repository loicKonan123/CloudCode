using System.Collections.Concurrent;
using CloudCode.Application.Interfaces;

namespace CloudCode.Infrastructure.Services;

public class QuizMatchmakingService : IQuizMatchmakingService
{
    private record QuizQueueEntry(Guid UserId, int Category, int Difficulty, DateTime JoinedAt);

    private readonly ConcurrentDictionary<Guid, QuizQueueEntry> _queue = new();

    public int QueueSize => _queue.Count;

    public (bool matched, Guid? opponentId, int? opponentCategory, int? opponentDifficulty) TryEnqueue(Guid userId, int category, int difficulty)
    {
        // Look for an opponent with the same category and difficulty
        var opponent = _queue.Values
            .FirstOrDefault(e => e.UserId != userId && e.Category == category && e.Difficulty == difficulty);

        if (opponent != null && _queue.TryRemove(opponent.UserId, out _))
        {
            // Don't add current user to queue — match found immediately
            return (true, opponent.UserId, opponent.Category, opponent.Difficulty);
        }

        // No match — join queue
        var entry = new QuizQueueEntry(userId, category, difficulty, DateTime.UtcNow);
        _queue[userId] = entry;
        return (false, null, null, null);
    }

    public void Dequeue(Guid userId)
    {
        _queue.TryRemove(userId, out _);
    }

    public bool IsInQueue(Guid userId)
    {
        return _queue.ContainsKey(userId);
    }
}
