namespace HomeToHome.Application.Abstractions;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
