using HomeToHome.Domain.Enums;

namespace HomeToHome.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? OrderId { get; set; }
    public NotificationType Type { get; set; }
    public required string Message { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public User? User { get; set; }
    public Order? Order { get; set; }
}
