using HomeToHome.Application.Abstractions;
using StackExchange.Redis;

namespace HomeToHome.Infrastructure.Caching;

public sealed class RedisRateLimiter(IConnectionMultiplexer redis) : IRateLimiter
{
    public async Task<bool> IsLimitedAsync(string key, int maxFailures, CancellationToken cancellationToken = default)
    {
        var value = await redis.GetDatabase().StringGetAsync(key);
        return value.TryParse(out long count) && count >= maxFailures;
    }

    public async Task RegisterFailureAsync(string key, TimeSpan window, CancellationToken cancellationToken = default)
    {
        var db = redis.GetDatabase();
        var count = await db.StringIncrementAsync(key);
        if (count == 1)
        {
            await db.KeyExpireAsync(key, window);
        }
    }

    public Task ResetAsync(string key, CancellationToken cancellationToken = default) =>
        redis.GetDatabase().KeyDeleteAsync(key);
}
