using HomeToHome.Application.Orders;
using HomeToHome.Domain.Entities;
using HomeToHome.Domain.Enums;
using HomeToHome.Domain.Errors;

namespace HomeToHome.UnitTests;

public sealed class OrderStateMachineTests
{
    private static readonly Guid Customer = Guid.NewGuid();
    private static readonly Guid Mother = Guid.NewGuid();
    private static readonly Guid Courier = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 10, 18, 12, 0, 0, TimeSpan.Zero);

    private static Order NewOrder(OrderStatus status, Guid? courier = null) => new()
    {
        Id = Guid.NewGuid(),
        CustomerId = Customer,
        MotherId = Mother,
        DeliveryPersonId = courier,
        Status = status,
        DeliveryAddress = "12 Nile St",
        CustomerPhone = "+201234567890",
        IdempotencyKey = "k",
    };

    [Fact]
    public void Placed_order_offers_mother_accept_or_reject_and_customer_cancel()
    {
        var order = NewOrder(OrderStatus.Placed);

        Assert.Equal([OrderStatus.Preparing, OrderStatus.Rejected], OrderStateMachine.AllowedActions(order, Mother));
        Assert.Equal([OrderStatus.Cancelled], OrderStateMachine.AllowedActions(order, Customer));
        Assert.Empty(OrderStateMachine.AllowedActions(order, Courier));
    }

    [Fact]
    public void Full_happy_path_records_an_event_per_step_and_manages_the_delivery_request()
    {
        var order = NewOrder(OrderStatus.Placed);

        OrderStateMachine.Apply(order, OrderStatus.Preparing, Mother, Now);
        OrderStateMachine.Apply(order, OrderStatus.ReadyForPickup, Mother, Now);
        Assert.Equal(DeliveryRequestStatus.Open, order.DeliveryRequest!.Status);

        order.DeliveryPersonId = Courier;
        order.DeliveryRequest.Status = DeliveryRequestStatus.Accepted;
        OrderStateMachine.Apply(order, OrderStatus.OutForDelivery, Courier, Now);
        OrderStateMachine.Apply(order, OrderStatus.Delivered, Courier, Now);

        Assert.Equal(OrderStatus.Delivered, order.Status);
        Assert.Equal(DeliveryRequestStatus.Closed, order.DeliveryRequest.Status);
        Assert.Equal(
            [OrderStatus.Preparing, OrderStatus.ReadyForPickup, OrderStatus.OutForDelivery, OrderStatus.Delivered],
            order.StatusEvents.Select(e => e.Status));
    }

    [Fact]
    public void Customer_cannot_cancel_once_preparing()
    {
        var order = NewOrder(OrderStatus.Preparing);

        var error = Assert.Throws<ConflictException>(
            () => OrderStateMachine.Apply(order, OrderStatus.Cancelled, Customer, Now));

        Assert.Equal("invalid_transition", error.Code);
        Assert.Equal(OrderStatus.Preparing, order.Status);
    }

    [Theory]
    [InlineData(OrderStatus.Preparing)]
    [InlineData(OrderStatus.Delivered)]
    public void Customer_cannot_drive_kitchen_or_delivery_steps(OrderStatus target)
    {
        var order = NewOrder(OrderStatus.Placed);

        Assert.Throws<ForbiddenException>(() => OrderStateMachine.Apply(order, target, Customer, Now));
    }

    [Fact]
    public void Unassigned_courier_cannot_pick_up()
    {
        var order = NewOrder(OrderStatus.ReadyForPickup, courier: Guid.NewGuid());

        Assert.Throws<ForbiddenException>(
            () => OrderStateMachine.Apply(order, OrderStatus.OutForDelivery, Courier, Now));
    }

    [Theory]
    [InlineData(OrderStatus.Delivered)]
    [InlineData(OrderStatus.Rejected)]
    [InlineData(OrderStatus.Cancelled)]
    public void Terminal_orders_allow_nothing(OrderStatus status)
    {
        var order = NewOrder(status, Courier);

        Assert.Empty(OrderStateMachine.AllowedActions(order, Customer));
        Assert.Empty(OrderStateMachine.AllowedActions(order, Mother));
        Assert.Empty(OrderStateMachine.AllowedActions(order, Courier));
    }
}
