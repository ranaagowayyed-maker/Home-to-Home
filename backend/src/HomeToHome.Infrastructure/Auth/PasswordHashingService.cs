using HomeToHome.Application.Abstractions;
using HomeToHome.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace HomeToHome.Infrastructure.Auth;

public sealed class PasswordHashingService : IPasswordHashingService
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(User user, string password) => _hasher.HashPassword(user, password);

    public bool Verify(User user, string password) =>
        _hasher.VerifyHashedPassword(user, user.PasswordHash, password) != PasswordVerificationResult.Failed;
}
