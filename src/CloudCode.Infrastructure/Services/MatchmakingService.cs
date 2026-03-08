using System.Collections.Concurrent;
using CloudCode.Application.Interfaces;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Singleton in-memory matchmaking queue.
/// Simple FIFO: first user that joins matches with the next one.
/// </summary>
public class MatchmakingService : IMatchmakingService
{
    // userId -> language preference
    private readonly ConcurrentDictionary<Guid, string> _queue = new();
    // Preserves insertion order
    private readonly ConcurrentQueue<Guid> _orderQueue = new();
    private readonly object _lock = new();

    public int QueueSize => _queue.Count;

    public (bool matched, Guid? opponentId) TryEnqueue(Guid userId, string language)
    {
        lock (_lock)
        {
            // Already in queue?
            if (_queue.ContainsKey(userId))
                return (false, null);

            // Find an opponent (anyone already waiting)
            while (_orderQueue.TryPeek(out var opponentId))
            {
                // Make sure they're still in the dictionary (not dequeued by race)
                if (opponentId == userId)
                {
                    // Shouldn't happen since we checked above, but skip self
                    _orderQueue.TryDequeue(out _);
                    continue;
                }

                if (_queue.ContainsKey(opponentId))
                {
                    // Match found — remove opponent from queue
                    _orderQueue.TryDequeue(out _);
                    _queue.TryRemove(opponentId, out _);
                    return (true, opponentId);
                }
                else
                {
                    // Stale entry, remove it
                    _orderQueue.TryDequeue(out _);
                }
            }

            // No opponent found — add to queue
            _queue[userId] = language;
            _orderQueue.Enqueue(userId);
            return (false, null);
        }
    }

    public void Dequeue(Guid userId)
    {
        lock (_lock)
        {
            _queue.TryRemove(userId, out _);
            // The stale entry in _orderQueue will be cleaned up on next TryEnqueue
        }
    }

    public bool IsInQueue(Guid userId) => _queue.ContainsKey(userId);
}
