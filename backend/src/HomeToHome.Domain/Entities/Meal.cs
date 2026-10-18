using HomeToHome.Domain.Enums;

namespace HomeToHome.Domain.Entities;

public class Meal
{
    public Guid Id { get; set; }
    public Guid MotherId { get; set; }
    public required string Name { get; set; }
    public string Description { get; set; } = string.Empty;
    public MealCategory Category { get; set; }
    public int PriceMinor { get; set; }
    public string? PhotoUrl { get; set; }
    public bool IsVisible { get; set; } = true;
    public bool IsArchived { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public MotherProfile? Mother { get; set; }
}
