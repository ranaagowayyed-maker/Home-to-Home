using HomeToHome.Domain.Entities;
using HomeToHome.Domain.Enums;
using HomeToHome.Domain.Errors;

namespace HomeToHome.Application.Orders;

/// <summary>Rows created by a transition: always a timeline event, and a delivery request when the order becomes ready.</summary>
public sealed record StatusChange(OrderStatusEvent Event, DeliveryRequest? OpenedRequest);

/// <summary>The only component allowed to change <see cref="Order.Status"/>.</summary>
public static class OrderStateMachine
{
    private enum Actor
    {
        Customer,
        Mother,
        AssignedDelivery,
    }

    private sealed record Transition(OrderStatus From, OrderStatus To, Actor Actor);

    private static readonly Transition[] Transitions =
    [
        new(OrderStatus.Placed, OrderStatus.Preparing, Actor.Mother),
        new(OrderStatus.Placed, OrderStatus.Rejected, Actor.Mother),
        new(OrderStatus.Placed, OrderStatus.Cancelled, Actor.Customer),
        new(OrderStatus.Preparing, OrderStatus.ReadyForPickup, Actor.Mother),
        new(OrderStatus.ReadyForPickup, OrderStatus.OutForDelivery, Actor.AssignedDelivery),
        new(OrderStatus.OutForDelivery, OrderStatus.Delivered, Actor.AssignedDelivery),
    ];

    public static IReadOnlyList<OrderStatus> AllowedActions(Order order, Guid userId) =>
        Transitions
            .Where(t => t.From == order.Status && Plays(order, userId, t.Actor))
            .Select(t => t.To)
            .ToList();

    /// <summary>
    /// Applies a transition and its side effects to the tracked order and returns the rows it created, which the caller
    /// adds to the context explicitly (their keys are set client-side, so EF would otherwise treat them as existing).
    /// </summary>
    public static StatusChange Apply(Order order, OrderStatus target, Guid userId, DateTimeOffset now)
    {
        var candidates = Transitions.Where(t => t.To == target && Plays(order, userId, t.Actor)).ToList();
        if (candidates.Count == 0)
        {
            throw new ForbiddenException("You can't move this order to that status.");
        }

        if (candidates.All(t => t.From != order.Status))
        {
            throw new ConflictException("invalid_transition", InvalidTransitionMessage(target));
        }

        order.Status = target;
        var statusEvent = new OrderStatusEvent
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Status = target,
            ActorId = userId,
            CreatedAt = now,
        };
        order.StatusEvents.Add(statusEvent);
        DeliveryRequest? openedRequest = null;

        switch (target)
        {
            case OrderStatus.ReadyForPickup:
                openedRequest = new DeliveryRequest
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    Status = DeliveryRequestStatus.Open,
                };
                order.DeliveryRequest = openedRequest;
                break;
            case OrderStatus.Delivered when order.DeliveryRequest is not null:
                order.DeliveryRequest.Status = DeliveryRequestStatus.Closed;
                break;
        }

        return new StatusChange(statusEvent, openedRequest);
    }

    private static bool Plays(Order order, Guid userId, Actor actor) => actor switch
    {
        Actor.Customer => order.CustomerId == userId,
        Actor.Mother => order.MotherId == userId,
        Actor.AssignedDelivery => order.DeliveryPersonId == userId,
        _ => false,
    };

    private static string InvalidTransitionMessage(OrderStatus target) => target switch
    {
        OrderStatus.Cancelled => "The kitchen already started preparing this order.",
        _ => "This order's status has changed. Refresh to see what you can do next.",
    };
}
