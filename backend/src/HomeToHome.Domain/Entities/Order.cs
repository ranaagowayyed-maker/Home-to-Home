using HomeToHome.Domain.Enums;

namespace HomeToHome.Domain.Entities;

public class Order
{
    public Guid Id { get; set; }
    public int Number { get; set; }
    public Guid CustomerId { get; set; }
    public Guid MotherId { get; set; }
    public Guid? DeliveryPersonId { get; set; }
    public OrderStatus Status { get; set; }
    public required string DeliveryAddress { get; set; }
    public required string CustomerPhone { get; set; }
    public string? Notes { get; set; }
    public int SubtotalMinor { get; set; }
    public int DeliveryFeeMinor { get; set; }
    public int TotalMinor { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public required string IdempotencyKey { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public uint Version { get; set; }

    public User? Customer { get; set; }
    public MotherProfile? Mother { get; set; }
    public User? DeliveryPerson { get; set; }
    public ICollection<OrderItem> Items { get; } = [];
    public ICollection<OrderStatusEvent> StatusEvents { get; } = [];
    public DeliveryRequest? DeliveryRequest { get; set; }

    public static int CalculateSubtotal(IEnumerable<OrderItem> items) =>
        items.Sum(i => i.UnitPriceMinor * i.Quantity);
}
