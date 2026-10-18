using HomeToHome.Domain.Enums;

namespace HomeToHome.Domain.Entities;

public class DeliveryRequest
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public DeliveryRequestStatus Status { get; set; }
    public Guid? AcceptedById { get; set; }
    public DateTimeOffset? AcceptedAt { get; set; }

    public Order? Order { get; set; }
    public User? AcceptedBy { get; set; }
}
