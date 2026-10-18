using HomeToHome.Domain.Entities;
using HomeToHome.Domain.Enums;

namespace HomeToHome.Application.Orders;

/// <summary>Builds the notification rows an order event produces; they are saved in the same transaction as the event.</summary>
internal static class OrderNotifications
{
    public static Notification OrderPlaced(Order order, DateTimeOffset now) =>
        Create(order.MotherId, order, NotificationType.OrderPlaced, $"New order #{order.Number}", now);

    public static IEnumerable<Notification> StatusChanged(Order order, DateTimeOffset now)
    {
        var message = order.Status switch
        {
            OrderStatus.Preparing => $"Order #{order.Number} is being prepared",
            OrderStatus.Rejected => $"Order #{order.Number} was rejected by the kitchen",
            OrderStatus.Cancelled => $"Order #{order.Number} was cancelled by the customer",
            OrderStatus.ReadyForPickup => $"Order #{order.Number} is ready for pickup",
            OrderStatus.OutForDelivery => $"Order #{order.Number} is out for delivery",
            OrderStatus.Delivered => $"Order #{order.Number} was delivered",
            _ => $"Order #{order.Number} was updated",
        };

        IEnumerable<Guid> recipients = order.Status switch
        {
            OrderStatus.Cancelled => [order.MotherId],
            OrderStatus.OutForDelivery or OrderStatus.Delivered => [order.CustomerId, order.MotherId],
            _ => [order.CustomerId],
        };
        return recipients.Select(userId => Create(userId, order, NotificationType.StatusChanged, message, now));
    }

    public static IEnumerable<Notification> DeliveryRequestOpened(Order order, IEnumerable<Guid> deliveryUserIds, DateTimeOffset now) =>
        deliveryUserIds.Select(userId =>
            Create(userId, order, NotificationType.DeliveryRequestOpen, $"New delivery request for order #{order.Number}", now));

    public static IEnumerable<Notification> DeliveryAccepted(Order order, string deliveryPersonName, DateTimeOffset now) =>
        new[] { order.CustomerId, order.MotherId }.Select(userId =>
            Create(userId, order, NotificationType.DeliveryAccepted, $"{deliveryPersonName} will deliver order #{order.Number}", now));

    private static Notification Create(Guid userId, Order order, NotificationType type, string message, DateTimeOffset now) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        OrderId = order.Id,
        Type = type,
        Message = message,
        CreatedAt = now,
    };
}
