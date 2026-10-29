using FluentValidation;
using HomeToHome.Application.Abstractions;
using HomeToHome.Application.Common;
using HomeToHome.Domain.Entities;
using HomeToHome.Domain.Enums;
using HomeToHome.Domain.Errors;
using Microsoft.EntityFrameworkCore;

namespace HomeToHome.Application.Auth;

public sealed class AuthService(
    IAppDbContext db,
    ITokenService tokens,
    IPasswordHashingService passwords,
    IRateLimiter rateLimiter,
    IClock clock,
    IValidator<RegisterRequest> registerValidator,
    IValidator<LoginRequest> loginValidator)
{
    public const int MaxFailedLogins = 5;
    public static readonly TimeSpan FailedLoginWindow = TimeSpan.FromMinutes(15);

    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        await registerValidator.EnsureValidAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        if (await db.Users.AnyAsync(u => u.Email == email, cancellationToken))
        {
            throw EmailTaken();
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Email = email,
            Phone = request.Phone.Trim(),
            Role = request.Role,
            CreatedAt = clock.UtcNow,
        };
        user.PasswordHash = passwords.Hash(user, request.Password);
        if (request.Role == Role.Mother)
        {
            user.MotherProfile = new MotherProfile { UserId = user.Id, KitchenName = request.KitchenName!.Trim() };
        }

        db.Users.Add(user);
        var result = IssueTokens(user);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Lost a race with a concurrent registration for the same email.
            throw EmailTaken();
        }

        return result;
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        await loginValidator.EnsureValidAsync(request, cancellationToken);

        var email = NormalizeEmail(request.Email);
        var limiterKey = $"login-failures:{email}";
        if (await rateLimiter.IsLimitedAsync(limiterKey, MaxFailedLogins, cancellationToken))
        {
            throw new RateLimitedException("Too many failed login attempts. Try again in 15 minutes.");
        }

        var user = await db.Users
            .Include(u => u.MotherProfile)
            .SingleOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (user is null || !passwords.Verify(user, request.Password))
        {
            await rateLimiter.RegisterFailureAsync(limiterKey, FailedLoginWindow, cancellationToken);
            throw new UnauthenticatedException("invalid_credentials", "Email or password is incorrect.");
        }

        await rateLimiter.ResetAsync(limiterKey, cancellationToken);
        var result = IssueTokens(user);
        await db.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task<AuthResult> RefreshAsync(string? refreshToken, CancellationToken cancellationToken)
    {
        var stored = await FindRefreshTokenAsync(refreshToken, cancellationToken)
            ?? throw InvalidRefreshToken();

        var now = clock.UtcNow;
        if (stored.RevokedAt is not null)
        {
            // A revoked token being replayed means it may have been stolen: end every session of this user.
            await db.RefreshTokens
                .Where(t => t.UserId == stored.UserId && t.RevokedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, now), cancellationToken);
            throw InvalidRefreshToken();
        }

        if (!stored.IsActive(now))
        {
            throw InvalidRefreshToken();
        }

        stored.RevokedAt = now;
        var user = await db.Users
            .Include(u => u.MotherProfile)
            .SingleAsync(u => u.Id == stored.UserId, cancellationToken);
        var result = IssueTokens(user);
        await db.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task LogoutAsync(string? refreshToken, CancellationToken cancellationToken)
    {
        var stored = await FindRefreshTokenAsync(refreshToken, cancellationToken);
        if (stored is { RevokedAt: null })
        {
            stored.RevokedAt = clock.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<UserDto> GetUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await db.Users
            .AsNoTracking()
            .Include(u => u.MotherProfile)
            .SingleOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new NotFoundException("User not found.");
        return UserDto.From(user);
    }

    private AuthResult IssueTokens(User user)
    {
        var raw = tokens.GenerateRefreshToken();
        var expiresAt = clock.UtcNow.Add(tokens.RefreshTokenLifetime);
        db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokens.HashRefreshToken(raw),
            ExpiresAt = expiresAt,
        });
        return new AuthResult(tokens.CreateAccessToken(user), raw, expiresAt, UserDto.From(user));
    }

    private async Task<RefreshToken?> FindRefreshTokenAsync(string? refreshToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return null;
        }

        var hash = tokens.HashRefreshToken(refreshToken);
        return await db.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static ConflictException EmailTaken() =>
        new("email_taken", "This email is already registered. Log in instead.");

    private static UnauthenticatedException InvalidRefreshToken() =>
        new("invalid_refresh_token", "Your session expired.");
}
