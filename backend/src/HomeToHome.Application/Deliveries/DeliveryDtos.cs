namespace HomeToHome.Application.Deliveries;

public sealed record DeliveryRequestSummaryDto(
    Guid Id,
    Guid OrderId,
    int OrderNumber,
    string KitchenName,
    string? KitchenCity,
    string? CustomerCity,
    int ItemCount,
    int DeliveryFeeMinor,
    DateTimeOffset OpenedAt);

public sealed record OpenDeliveryRequestsDto(
    IReadOnlyList<DeliveryRequestSummaryDto> Items,
    int ActiveDeliveries,
    int MaxActiveDeliveries);
