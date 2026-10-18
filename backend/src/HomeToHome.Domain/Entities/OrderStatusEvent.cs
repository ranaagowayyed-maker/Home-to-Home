using HomeToHome.Domain.Enums;

namespace HomeToHome.Domain.Entities;

public class OrderStatusEvent
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public OrderStatus Status { get; set; }
    public Guid ActorId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Order? Order { get; set; }
    public User? Actor { get; set; }
}
