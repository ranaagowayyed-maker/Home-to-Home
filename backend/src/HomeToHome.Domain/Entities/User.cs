using HomeToHome.Domain.Enums;

namespace HomeToHome.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public Role Role { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public MotherProfile? MotherProfile { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; } = [];
}
