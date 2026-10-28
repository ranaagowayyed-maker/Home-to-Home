using HomeToHome.Domain.Enums;

namespace HomeToHome.Application.Profiles;

/// <summary>
/// A partial profile update: null leaves a field unchanged and an empty string clears an optional one.
/// <see cref="Email"/> and <see cref="Role"/> are bound only so that sending them is rejected rather than ignored.
/// </summary>
public sealed record UpdateProfileRequest(
    string? Name,
    string? Phone,
    string? Address,
    string? City,
    string? KitchenName,
    string? Bio,
    string? Email,
    Role? Role);

public sealed record UpdateAvailabilityRequest(bool? IsAvailable);

public sealed record AvailabilityDto(bool IsAvailable);
