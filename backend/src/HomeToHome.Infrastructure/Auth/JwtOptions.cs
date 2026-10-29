namespace HomeToHome.Infrastructure.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "home-to-home";
    public string Audience { get; set; } = "home-to-home";

    /// <summary>HMAC-SHA256 key, at least 32 bytes. Supplied through the environment, never committed.</summary>
    public string SigningKey { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 14;
}
