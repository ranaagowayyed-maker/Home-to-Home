using HomeToHome.Domain.Entities;
using HomeToHome.Domain.Enums;

namespace HomeToHome.Application.Notifications;

public sealed record NotificationDto(
    Guid Id,
    NotificationType Type,
    string Message,
    Guid? OrderId,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReadAt)
{
    public static NotificationDto From(Notification n) => new(n.Id, n.Type, n.Message, n.OrderId, n.CreatedAt, n.ReadAt);
}

/// <summary>One page of the bell list, newest first, with the user's total unread count.</summary>
public sealed record NotificationPageDto(
    IReadOnlyList<NotificationDto> Items,
    int Page,
    int PageSize,
    int Total,
    int UnreadCount);
