using HomeToHome.Domain.Enums;

namespace HomeToHome.Application.Orders;

public sealed record PlaceOrderItem(Guid MealId, int Quantity);

public sealed record PlaceOrderRequest(
    IReadOnlyList<PlaceOrderItem>? Items,
    string DeliveryAddress,
    string CustomerPhone,
    string? Notes);

public sealed record ChangeStatusRequest(OrderStatus Status);

public sealed record OrderItemDto(Guid MealId, string Name, int UnitPriceMinor, int Quantity, int LineTotalMinor);

public sealed record TimelineEntryDto(OrderStatus Status, DateTimeOffset At);

public sealed record PersonDto(string Name, string Phone);

public sealed record PickupContactDto(string Name, string Phone, string? Address);

public sealed record OrderDetailDto(
    Guid Id,
    int Number,
    OrderStatus Status,
    DateTimeOffset CreatedAt,
    string KitchenName,
    Guid MotherId,
    IReadOnlyList<OrderItemDto> Items,
    int SubtotalMinor,
    int DeliveryFeeMinor,
    int TotalMinor,
    PaymentMethod PaymentMethod,
    string DeliveryAddress,
    string CustomerPhone,
    string? Notes,
    string CustomerName,
    PickupContactDto Mother,
    PersonDto? DeliveryPerson,
    IReadOnlyList<TimelineEntryDto> Timeline,
    IReadOnlyList<OrderStatus> AllowedActions);

public sealed record OrderSummaryDto(
    Guid Id,
    int Number,
    OrderStatus Status,
    DateTimeOffset CreatedAt,
    string KitchenName,
    string CustomerName,
    int ItemCount,
    int TotalMinor);

/// <summary>Result of placing an order: <see cref="Created"/> is false when the idempotency key was already used.</summary>
public sealed record PlaceOrderResult(OrderDetailDto Order, bool Created);
