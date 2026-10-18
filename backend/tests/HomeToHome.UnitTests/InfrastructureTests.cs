using HomeToHome.Application.Abstractions;
using HomeToHome.Domain.Entities;
using HomeToHome.Domain.Enums;
using HomeToHome.Infrastructure.Auth;
using HomeToHome.Infrastructure.Caching;
using HomeToHome.Infrastructure.Storage;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;

namespace HomeToHome.UnitTests;

public sealed class InfrastructureTests
{
    private sealed class FakeClock : IClock
    {
        public DateTimeOffset UtcNow { get; set; } = new(2026, 10, 18, 9, 0, 0, TimeSpan.Zero);
    }

    private readonly FakeClock _clock = new();

    [Fact]
    public void Access_token_carries_subject_role_and_15_minute_expiry()
    {
        var service = new JwtTokenService(
            Options.Create(new JwtOptions { SigningKey = new string('k', 32) }),
            _clock);
        var user = new User { Id = Guid.NewGuid(), Name = "Omar", Email = "o@example.test", Phone = "+2012345678", Role = Role.Delivery };

        var token = service.CreateAccessToken(user);

        var jwt = new JsonWebToken(token.Value);
        Assert.Equal(user.Id.ToString(), jwt.Subject);
        Assert.Equal(RoleNames.Delivery, jwt.GetClaim(JwtTokenService.RoleClaim).Value);
        Assert.Equal(_clock.UtcNow.AddMinutes(15), token.ExpiresAt);
    }

    [Fact]
    public void Refresh_tokens_are_random_and_hashing_is_stable()
    {
        var service = new JwtTokenService(Options.Create(new JwtOptions { SigningKey = new string('k', 32) }), _clock);

        var first = service.GenerateRefreshToken();
        var second = service.GenerateRefreshToken();

        Assert.NotEqual(first, second);
        Assert.Equal(service.HashRefreshToken(first), service.HashRefreshToken(first));
        Assert.Equal(64, service.HashRefreshToken(first).Length);
    }

    [Fact]
    public void Password_hash_verifies_only_the_right_password()
    {
        var hasher = new PasswordHashingService();
        var user = new User { Name = "Sara", Email = "s@example.test", Phone = "+2012345678" };
        user.PasswordHash = hasher.Hash(user, "Passw0rd");

        Assert.True(hasher.Verify(user, "Passw0rd"));
        Assert.False(hasher.Verify(user, "passw0rd"));
    }

    [Fact]
    public async Task In_memory_rate_limiter_limits_after_max_failures_and_expires()
    {
        var limiter = new InMemoryRateLimiter(_clock);
        for (var i = 0; i < 5; i++)
        {
            Assert.False(await limiter.IsLimitedAsync("k", 5));
            await limiter.RegisterFailureAsync("k", TimeSpan.FromMinutes(15));
        }

        Assert.True(await limiter.IsLimitedAsync("k", 5));

        _clock.UtcNow = _clock.UtcNow.AddMinutes(16);
        Assert.False(await limiter.IsLimitedAsync("k", 5));
    }

    [Fact]
    public void Photo_urls_must_sit_directly_under_the_mothers_prefix()
    {
        var storage = new S3PhotoStorage(
            Options.Create(new StorageOptions
            {
                Bucket = "b",
                AccessKey = "a",
                SecretKey = "s",
                PublicBaseUrl = "https://cdn.test/b",
            }),
            _clock,
            new Lazy<Amazon.S3.IAmazonS3>(() => throw new InvalidOperationException()));
        var mother = Guid.NewGuid();

        Assert.True(storage.IsOwnedBy(mother, $"https://cdn.test/b/meals/{mother}/x.jpg"));
        Assert.False(storage.IsOwnedBy(mother, $"https://cdn.test/b/meals/{Guid.NewGuid()}/x.jpg"));
        Assert.False(storage.IsOwnedBy(mother, $"https://cdn.test/b/meals/{mother}/../other/x.jpg"));
        Assert.False(storage.IsOwnedBy(mother, $"https://evil.test/b/meals/{mother}/x.jpg"));
    }
}
