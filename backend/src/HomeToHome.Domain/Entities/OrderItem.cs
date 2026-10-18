namespace HomeToHome.Domain.Entities;

public class OrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid MealId { get; set; }
    public required string NameSnapshot { get; set; }
    public int UnitPriceMinor { get; set; }
    public int Quantity { get; set; }

    public Order? Order { get; set; }
    public Meal? Meal { get; set; }
}
