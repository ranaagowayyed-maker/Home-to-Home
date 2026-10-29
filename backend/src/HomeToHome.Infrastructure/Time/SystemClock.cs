using HomeToHome.Application.Abstractions;

namespace HomeToHome.Infrastructure.Time;

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
