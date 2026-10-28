using FluentValidation;
using HomeToHome.Application.Abstractions;
using HomeToHome.Application.Common;
using HomeToHome.Domain.Entities;
using HomeToHome.Domain.Enums;
using HomeToHome.Domain.Errors;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace HomeToHome.Application.Orders;

public sealed class OrderService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IClock clock,
    IOptions<OrderingOptions> options,
    IValidator<PlaceOrderRequest> placeValidator)
{
    public const int MaxIdempotencyKeyLength = 64;

    private const string NextOrderNumberSql = "SELECT nextval('" + Order.NumberSequence + "')::int AS \"Value\"";

    public async Task<PlaceOrderResult> PlaceAsync(
        string? idempotencyKey,
        PlaceOrderRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey) || idempotencyKey.Length > MaxIdempotencyKeyLength)
        {
            throw new Domain.Errors.ValidationException(new Dictionary<string, string[]>
            {
                ["idempotencyKey"] = ["Send an Idempotency-Key header of at most 64 characters."],
            });
        }

        var customerId = currentUser.UserId;
        var existing = await FindByIdempotencyKeyAsync(idempotencyKey, customerId, cancellationToken);
        if (existing is not null)
        {
            return new PlaceOrderResult(existing, Created: false);
        }

        await placeValidator.EnsureValidAsync(request, cancellationToken);

        var mealIds = request.Items!.Select(i => i.MealId).ToList();
        var meals = await db.Meals
            .AsNoTracking()
            .Include(m => m.Mother)
            .Where(m => mealIds.Contains(m.Id))
            .ToListAsync(cancellationToken);

        if (meals.Select(m => m.MotherId).Distinct().Count() > 1)
        {
            throw new Domain.Errors.ValidationException(new Dictionary<string, string[]>
            {
                ["items"] = ["All meals must come from one kitchen."],
            });
        }

        if (meals.Count > 0 && meals.All(m => m.Mother is { IsAvailable: false }))
        {
            throw new ConflictException(
                "kitchen_paused",
                "This kitchen is not taking orders right now.",
                new Dictionary<string, object?> { ["unavailableMealIds"] = mealIds });
        }

        var unavailable = mealIds
            .Where(id => meals.SingleOrDefault(m => m.Id == id) is not { IsVisible: true, IsArchived: false, Mother.IsAvailable: true })
            .ToList();
        if (unavailable.Count > 0)
        {
            throw new ConflictException(
                "meal_unavailable",
                "Some meals in your cart are no longer available.",
                new Dictionary<string, object?> { ["unavailableMealIds"] = unavailable });
        }

        var now = clock.UtcNow;
        var number = await db.Database
            .SqlQueryRaw<int>(NextOrderNumberSql)
            .SingleAsync(cancellationToken);
        var order = new Order
        {
            Id = Guid.NewGuid(),
            Number = number,
            CustomerId = customerId,
            MotherId = meals[0].MotherId,
            Status = OrderStatus.Placed,
            DeliveryAddress = request.DeliveryAddress.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            PaymentMethod = PaymentMethod.CashOnDelivery,
            IdempotencyKey = idempotencyKey,
            CreatedAt = now,
        };
        foreach (var line in request.Items!)
        {
            var meal = meals.Single(m => m.Id == line.MealId);
            order.Items.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                MealId = meal.Id,
                NameSnapshot = meal.Name,
                UnitPriceMinor = meal.PriceMinor,
                Quantity = line.Quantity,
            });
        }

        order.SubtotalMinor = Order.CalculateSubtotal(order.Items);
        order.DeliveryFeeMinor = options.Value.DeliveryFeeMinor;
        order.TotalMinor = order.SubtotalMinor + order.DeliveryFeeMinor;
        order.StatusEvents.Add(new OrderStatusEvent
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Status = OrderStatus.Placed,
            ActorId = customerId,
            CreatedAt = now,
        });
        db.Orders.Add(order);
        db.Notifications.Add(OrderNotifications.OrderPlaced(order, now));

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // A concurrent request with the same key won the insert; return the order it created.
            db.Orders.Entry(order).State = EntityState.Detached;
            var winner = await FindByIdempotencyKeyAsync(idempotencyKey, customerId, cancellationToken);
            return winner is not null
                ? new PlaceOrderResult(winner, Created: false)
                : throw new ConflictException("idempotency_key_reused", "This Idempotency-Key was already used.");
        }

        return new PlaceOrderResult(await GetAsync(order.Id, cancellationToken), Created: true);
    }

    public async Task<OrderDetailDto> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        var order = await LoadAsync(id, tracking: false, cancellationToken);
        EnsureParty(order);
        return ToDetail(order, currentUser.UserId);
    }

    public async Task<Paged<OrderSummaryDto>> ListAsync(
        IReadOnlyCollection<OrderStatus> statuses,
        PageRequest page,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId;
        var query = currentUser.Role switch
        {
            Role.Customer => db.Orders.Where(o => o.CustomerId == userId),
            Role.Mother => db.Orders.Where(o => o.MotherId == userId),
            Role.Delivery => db.Orders.Where(o => o.DeliveryPersonId == userId),
            _ => db.Orders.Where(_ => false),
        };
        if (statuses.Count > 0)
        {
            query = query.Where(o => statuses.Contains(o.Status));
        }

        return await ToSummaryPageAsync(query.OrderByDescending(o => o.CreatedAt).ThenBy(o => o.Id), page, cancellationToken);
    }

    public async Task<OrderDetailDto> ChangeStatusAsync(Guid id, ChangeStatusRequest request, CancellationToken cancellationToken)
    {
        var order = await LoadAsync(id, tracking: true, cancellationToken);
        EnsureParty(order);

        var now = clock.UtcNow;
        var change = OrderStateMachine.Apply(order, request.Status, currentUser.UserId, now);
        db.OrderStatusEvents.Add(change.Event);
        if (change.OpenedRequest is not null)
        {
            db.DeliveryRequests.Add(change.OpenedRequest);
        }

        db.Notifications.AddRange(OrderNotifications.StatusChanged(order, now));
        if (order.Status == OrderStatus.ReadyForPickup)
        {
            var deliveryUsers = await db.Users
                .Where(u => u.Role == Role.Delivery)
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);
            db.Notifications.AddRange(OrderNotifications.DeliveryRequestOpened(order, deliveryUsers, now));
        }

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictException("order_changed", "This order was just updated. Refresh to see its current status.");
        }
        catch (DbUpdateException)
        {
            // Unique (order_id) on delivery_requests: a parallel "Mark ready" already opened the request.
            throw new ConflictException("order_changed", "This order was just updated. Refresh to see its current status.");
        }

        return await GetAsync(id, cancellationToken);
    }

    internal static async Task<Paged<OrderSummaryDto>> ToSummaryPageAsync(
        IQueryable<Order> ordered,
        PageRequest page,
        CancellationToken cancellationToken)
    {
        var total = await ordered.CountAsync(cancellationToken);
        var items = await ordered
            .AsNoTracking()
            .Skip((page.SafePage - 1) * page.SafePageSize)
            .Take(page.SafePageSize)
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.Number,
                o.Status,
                o.CreatedAt,
                o.Mother!.KitchenName,
                o.Customer!.Name,
                o.Items.Sum(i => i.Quantity),
                o.TotalMinor))
            .ToListAsync(cancellationToken);
        return new Paged<OrderSummaryDto>(items, page.SafePage, page.SafePageSize, total);
    }

    internal async Task<Order> LoadAsync(Guid id, bool tracking, CancellationToken cancellationToken)
    {
        var query = db.Orders
            .Include(o => o.Items)
            .Include(o => o.StatusEvents)
            .Include(o => o.DeliveryRequest)
            .Include(o => o.Customer)
            .Include(o => o.Mother).ThenInclude(m => m!.User)
            .Include(o => o.DeliveryPerson)
            .AsSplitQuery();
        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        return await query.SingleOrDefaultAsync(o => o.Id == id, cancellationToken)
            ?? throw new NotFoundException("Order not found.");
    }

    internal static OrderDetailDto ToDetail(Order order, Guid viewerId) => new(
        order.Id,
        order.Number,
        order.Status,
        order.CreatedAt,
        order.Mother!.KitchenName,
        order.MotherId,
        order.Items
            .Select(i => new OrderItemDto(i.MealId, i.NameSnapshot, i.UnitPriceMinor, i.Quantity, i.UnitPriceMinor * i.Quantity))
            .ToList(),
        order.SubtotalMinor,
        order.DeliveryFeeMinor,
        order.TotalMinor,
        order.PaymentMethod,
        order.DeliveryAddress,
        order.CustomerPhone,
        order.Notes,
        order.Customer!.Name,
        new PickupContactDto(order.Mother.User!.Name, order.Mother.User.Phone, order.Mother.User.Address),
        order.DeliveryPerson is null ? null : new PersonDto(order.DeliveryPerson.Name, order.DeliveryPerson.Phone),
        order.StatusEvents
            .OrderBy(e => e.CreatedAt)
            .Select(e => new TimelineEntryDto(e.Status, e.CreatedAt))
            .ToList(),
        OrderStateMachine.AllowedActions(order, viewerId));

    private async Task<OrderDetailDto?> FindByIdempotencyKeyAsync(
        string idempotencyKey,
        Guid customerId,
        CancellationToken cancellationToken)
    {
        var id = await db.Orders
            .Where(o => o.IdempotencyKey == idempotencyKey)
            .Select(o => new { o.Id, o.CustomerId })
            .SingleOrDefaultAsync(cancellationToken);
        if (id is null)
        {
            return null;
        }

        if (id.CustomerId != customerId)
        {
            throw new ConflictException("idempotency_key_reused", "This Idempotency-Key was already used.");
        }

        return ToDetail(await LoadAsync(id.Id, tracking: false, cancellationToken), customerId);
    }

    private void EnsureParty(Order order)
    {
        var userId = currentUser.UserId;
        if (order.CustomerId != userId && order.MotherId != userId && order.DeliveryPersonId != userId)
        {
            throw new ForbiddenException("You don't have access to that order.");
        }
    }
}
