namespace HomeToHome.Domain.Enums;

public enum OrderStatus
{
    Placed,
    Preparing,
    ReadyForPickup,
    OutForDelivery,
    Delivered,
    Rejected,
    Cancelled,
}
