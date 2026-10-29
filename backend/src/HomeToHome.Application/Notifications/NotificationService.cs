using HomeToHome.Application.Abstractions;
using HomeToHome.Application.Common;
using HomeToHome.Domain.Errors;
using Microsoft.EntityFrameworkCore;

namespace HomeToHome.Application.Notifications;

/// <summary>Reads and marks the current user's notifications; the rows are written by the order events themselves.</summary>
public sealed class NotificationService(IAppDbContext db, ICurrentUser currentUser, IClock clock)
{
    public async Task<NotificationPageDto> ListAsync(PageRequest page, CancellationToken cancellationToken)
    {
        var mine = db.Notifications.AsNoTracking().Where(n => n.UserId == currentUser.UserId);
        var total = await mine.CountAsync(cancellationToken);
        var unread = await mine.CountAsync(n => n.ReadAt == null, cancellationToken);
        var items = await mine
            .OrderByDescending(n => n.CreatedAt)
            .ThenBy(n => n.Id)
            .Skip((page.SafePage - 1) * page.SafePageSize)
            .Take(page.SafePageSize)
            .ToListAsync(cancellationToken);
        return new NotificationPageDto(
            items.Select(NotificationDto.From).ToList(), page.SafePage, page.SafePageSize, total, unread);
    }

    /// <summary>Idempotent: reading an already read notification keeps its first read time.</summary>
    public async Task<NotificationDto> MarkReadAsync(Guid id, CancellationToken cancellationToken)
    {
        var notification = await db.Notifications.SingleOrDefaultAsync(n => n.Id == id, cancellationToken)
            ?? throw new NotFoundException("Notification not found.");
        if (notification.UserId != currentUser.UserId)
        {
            throw new ForbiddenException("You don't have access to that notification.");
        }

        if (notification.ReadAt is null)
        {
            notification.ReadAt = clock.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }

        return NotificationDto.From(notification);
    }
}
