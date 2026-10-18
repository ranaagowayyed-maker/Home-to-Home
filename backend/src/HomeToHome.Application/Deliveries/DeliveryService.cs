using HomeToHome.Application.Abstractions;
using HomeToHome.Application.Common;
using HomeToHome.Application.Orders;
using HomeToHome.Domain.Entities;
using HomeToHome.Domain.Enums;
using HomeToHome.Domain.Errors;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace HomeToHome.Application.Deliveries;

public sealed class DeliveryService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IClock clock,
    IOptions<OrderingOptions> options,
    OrderService orders)
{
    private static readonly OrderStatus[] ActiveStatuses = [OrderStatus.ReadyForPickup, OrderStatus.OutForDelivery];

    public async Task<OpenDeliveryRequestsDto> ListOpenAsync(CancellationToken cancellationToken)
    {
        var items = await db.DeliveryRequests
            .AsNoTracking()
            .Where(r => r.Status == DeliveryRequestStatus.Open)
            .OrderBy(r => r.Order!.StatusEvents
                .Where(e => e.Status == OrderStatus.ReadyForPickup)
                .Min(e => e.CreatedAt))
            .Take(PageRequest.MaxPageSize)
            .Select(r => new DeliveryRequestSummaryDto(
                r.Id,
                r.OrderId,
                r.Order!.Number,
                r.Order.Mother!.KitchenName,
                r.Order.Mother.User!.City,
                r.Order.Customer!.City,
                r.Order.Items.Sum(i => i.Quantity),
                r.Order.DeliveryFeeMinor,
                r.Order.StatusEvents.Where(e => e.Status == OrderStatus.ReadyForPickup).Min(e => e.CreatedAt)))
            .ToListAsync(cancellationToken);
        return new OpenDeliveryRequestsDto(items, await CountActiveAsync(currentUser.UserId, cancellationToken),
            options.Value.MaxActiveDeliveries);
    }

    /// <summary>
    /// Accepts a request so that exactly one delivery person wins: the conditional update on the request row is atomic,
    /// and locking the caller's own user row serializes their accepts so the active-delivery limit holds.
    /// </summary>
    public async Task<OrderDetailDto> AcceptAsync(Guid requestId, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId;
        var now = clock.UtcNow;

        await using (var transaction = await db.Database.BeginTransactionAsync(cancellationToken))
        {
            // ToListAsync keeps the SQL as written; composing (SingleAsync) would wrap the FOR UPDATE in a subquery.
            var me = (await db.Users
                .FromSql($"SELECT * FROM users WHERE id = {userId} FOR UPDATE")
                .AsNoTracking()
                .ToListAsync(cancellationToken)).Single();

            if (await CountActiveAsync(userId, cancellationToken) >= options.Value.MaxActiveDeliveries)
            {
                throw new ConflictException("active_limit", "Finish an active delivery first.");
            }

            var won = await db.DeliveryRequests
                .Where(r => r.Id == requestId && r.Status == DeliveryRequestStatus.Open)
                .ExecuteUpdateAsync(
                    s => s
                        .SetProperty(r => r.Status, DeliveryRequestStatus.Accepted)
                        .SetProperty(r => r.AcceptedById, userId)
                        .SetProperty(r => r.AcceptedAt, now),
                    cancellationToken);
            if (won == 0)
            {
                throw await LostRequestErrorAsync(requestId, cancellationToken);
            }

            var order = await db.Orders.SingleAsync(o => o.DeliveryRequest!.Id == requestId, cancellationToken);
            order.DeliveryPersonId = userId;
            db.Notifications.AddRange(OrderNotifications.DeliveryAccepted(order, me.Name, now));
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return OrderService.ToDetail(await orders.LoadAsync(order.Id, tracking: false, cancellationToken), userId);
        }
    }

    public Task<Paged<OrderSummaryDto>> ListMineAsync(PageRequest page, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId;
        var query = db.Orders
            .Where(o => o.DeliveryPersonId == userId)
            .OrderBy(o => ActiveStatuses.Contains(o.Status) ? 0 : 1)
            .ThenByDescending(o => o.CreatedAt)
            .ThenBy(o => o.Id);
        return OrderService.ToSummaryPageAsync(query, page, cancellationToken);
    }

    private Task<int> CountActiveAsync(Guid userId, CancellationToken cancellationToken) =>
        db.Orders.CountAsync(o => o.DeliveryPersonId == userId && ActiveStatuses.Contains(o.Status), cancellationToken);

    private async Task<DomainException> LostRequestErrorAsync(Guid requestId, CancellationToken cancellationToken)
    {
        var status = await db.DeliveryRequests
            .Where(r => r.Id == requestId)
            .Select(r => (DeliveryRequestStatus?)r.Status)
            .SingleOrDefaultAsync(cancellationToken);
        return status switch
        {
            null => new NotFoundException("Delivery request not found."),
            DeliveryRequestStatus.Accepted => new ConflictException("delivery_taken", "This delivery was just taken."),
            _ => new ConflictException("request_closed", "This request is no longer available."),
        };
    }
}
