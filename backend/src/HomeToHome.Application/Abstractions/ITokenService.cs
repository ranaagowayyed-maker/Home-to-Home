using HomeToHome.Domain.Entities;

namespace HomeToHome.Application.Abstractions;

public sealed record AccessToken(string Value, DateTimeOffset ExpiresAt);

public interface ITokenService
{
    TimeSpan RefreshTokenLifetime { get; }

    AccessToken CreateAccessToken(User user);

    string GenerateRefreshToken();

    string HashRefreshToken(string refreshToken);
}
