using HomeToHome.Domain.Entities;
using HomeToHome.Domain.Enums;

namespace HomeToHome.Application.Meals;

public sealed record PhotoUploadRequest(string ContentType, long Size);

public sealed record CreateMealRequest(
    string Name,
    string? Description,
    MealCategory Category,
    int PriceMinor,
    string? PhotoUrl);

public sealed record UpdateMealRequest(
    string? Name,
    string? Description,
    MealCategory? Category,
    int? PriceMinor,
    string? PhotoUrl,
    bool? IsVisible,
    bool? IsArchived);

public sealed record MealDto(
    Guid Id,
    string Name,
    string Description,
    MealCategory Category,
    int PriceMinor,
    string? PhotoUrl,
    bool IsVisible,
    bool IsArchived,
    DateTimeOffset CreatedAt)
{
    public static MealDto From(Meal meal) => new(
        meal.Id,
        meal.Name,
        meal.Description,
        meal.Category,
        meal.PriceMinor,
        meal.PhotoUrl,
        meal.IsVisible,
        meal.IsArchived,
        meal.CreatedAt);
}
