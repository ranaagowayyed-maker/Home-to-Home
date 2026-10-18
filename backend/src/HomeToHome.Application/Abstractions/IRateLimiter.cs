namespace HomeToHome.Application.Abstractions;

/// <summary>Counts failures per key inside a fixed window.</summary>
public interface IRateLimiter
{
    Task<bool> IsLimitedAsync(string key, int maxFailures, CancellationToken cancellationToken = default);

    Task RegisterFailureAsync(string key, TimeSpan window, CancellationToken cancellationToken = default);

    Task ResetAsync(string key, CancellationToken cancellationToken = default);
}
