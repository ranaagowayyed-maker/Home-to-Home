using HomeToHome.Application.Common;
using HomeToHome.Application.Notifications;
using Microsoft.AspNetCore.Mvc;

namespace HomeToHome.Api.Controllers;

[ApiController]
[Route("api/v1/notifications")]
public sealed class NotificationsController(NotificationService notifications) : ControllerBase
{
    [HttpGet]
    public Task<NotificationPageDto> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PageRequest.DefaultPageSize,
        CancellationToken cancellationToken = default) =>
        notifications.ListAsync(new PageRequest(page, pageSize), cancellationToken);

    [HttpPost("{id:guid}/read")]
    public Task<NotificationDto> MarkRead(Guid id, CancellationToken cancellationToken) =>
        notifications.MarkReadAsync(id, cancellationToken);
}
