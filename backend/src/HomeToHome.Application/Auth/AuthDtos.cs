using HomeToHome.Application.Abstractions;
using HomeToHome.Domain.Entities;
using HomeToHome.Domain.Enums;

namespace HomeToHome.Application.Auth;

public sealed record RegisterRequest(
    string Name,
    string Email,
    string Phone,
    string Password,
    Role Role,
    string? KitchenName);

public sealed record LoginRequest(string Email, string Password);

public sealed record UserDto(
    Guid Id,
    string Name,
    string Email,
    string Phone,
    Role Role,
    string? Address,
    string? City,
    string? KitchenName)
{
    public static UserDto From(User user) => new(
        user.Id,
        user.Name,
        user.Email,
        user.Phone,
        user.Role,
        user.Address,
        user.City,
        user.MotherProfile?.KitchenName);
}

public sealed record AuthResult(
    AccessToken AccessToken,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt,
    UserDto User);
