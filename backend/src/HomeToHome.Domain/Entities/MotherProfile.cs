namespace HomeToHome.Domain.Entities;

public class MotherProfile
{
    public Guid UserId { get; set; }
    public required string KitchenName { get; set; }
    public string? Bio { get; set; }
    public bool IsAvailable { get; set; } = true;

    public User? User { get; set; }
    public ICollection<Meal> Meals { get; } = [];
}
