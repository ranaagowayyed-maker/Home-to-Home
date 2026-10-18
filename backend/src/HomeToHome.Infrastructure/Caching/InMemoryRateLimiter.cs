using System.Collections.Concurrent;
using HomeToHome.Application.Abstractions;

namespace HomeToHome.Infrastructure.Caching;

/// <summary>Single-instance fallback used when no Redis connection is configured (local runs and tests).</summary>
public sealed class InMemoryRateLimiter(IClock clock) : IRateLimiter
{
    private readonly ConcurrentDictionary<string, (int Count, DateTimeOffset ExpiresAt)> _entries = new();

    public Task<bool> IsLimitedAsync(string key, int maxFailures, CancellationToken cancellationToken = default) =>
        Task.FromResult(_entries.TryGetValue(key, out var entry)
            && entry.ExpiresAt > clock.UtcNow
            && entry.Count >= maxFailures);

    public Task RegisterFailureAsync(string key, TimeSpan window, CancellationToken cancellationToken = default)
    {
        var now = clock.UtcNow;
        _entries.AddOrUpdate(
            key,
            _ => (1, now.Add(window)),
            (_, entry) => entry.ExpiresAt > now ? (entry.Count + 1, entry.ExpiresAt) : (1, now.Add(window)));
        return Task.CompletedTask;
    }

    public Task ResetAsync(string key, CancellationToken cancellationToken = default)
    {
        _entries.TryRemove(key, out _);
        return Task.CompletedTask;
    }
}
