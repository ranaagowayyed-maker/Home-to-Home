using System.Net;
using System.Text.Json;

namespace HomeToHome.IntegrationTests;

public sealed record OrderItemBody(Guid MealId, string Name, int UnitPriceMinor, int Quantity, int LineTotalMinor);

public sealed record TimelineBody(string Status, DateTimeOffset At);

public sealed record PersonBody(string Name, string Phone);

public sealed record OrderBody(
    Guid Id,
    int Number,
    string Status,
    string KitchenName,
    List<OrderItemBody> Items,
    int SubtotalMinor,
    int DeliveryFeeMinor,
    int TotalMinor,
    string PaymentMethod,
    string DeliveryAddress,
    string CustomerPhone,
    PersonBody Mother,
    PersonBody? DeliveryPerson,
    List<TimelineBody> Timeline,
    List<string> AllowedActions);

public sealed record OrderSummaryBody(Guid Id, int Number, string Status, int ItemCount, int TotalMinor);

public sealed record DeliveryRequestBody(Guid Id, Guid OrderId, int OrderNumber, string KitchenName, int ItemCount);

public sealed record OpenRequestsBody(List<DeliveryRequestBody> Items, int ActiveDeliveries, int MaxActiveDeliveries);

/// <summary>Helpers that walk an order through its lifecycle over HTTP.</summary>
public static class OrderFlow
{
    public static async Task<MealBody> CreateMealAsync(this HttpClient client, Session mother, string name = "Koshari", int priceMinor = 950)
    {
        var response = await client.SendAsync(ApiClient.Authed(HttpMethod.Post, "/api/v1/meals", mother, new
        {
            name,
            description = "Rice, lentils and pasta with tomato sauce.",
            category = "MAIN_DISH",
            priceMinor,
        }));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await response.ReadAsync<MealBody>();
    }

    public static HttpRequestMessage PlaceRequest(Session customer, object items, string? idempotencyKey)
    {
        var request = ApiClient.Authed(HttpMethod.Post, "/api/v1/orders", customer, new
        {
            items,
            deliveryAddress = "12 Nile Street, Cairo",
            customerPhone = "+201234567890",
            notes = "Ring twice",
        });
        if (idempotencyKey is not null)
        {
            request.Headers.Add("Idempotency-Key", idempotencyKey);
        }

        return request;
    }

    public static async Task<OrderBody> PlaceAsync(this HttpClient client, Session customer, params (Guid MealId, int Quantity)[] items)
    {
        var response = await client.SendAsync(PlaceRequest(
            customer, items.Select(i => new { mealId = i.MealId, quantity = i.Quantity }).ToArray(), Guid.NewGuid().ToString()));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await response.ReadAsync<OrderBody>();
    }

    public static Task<HttpResponseMessage> ChangeStatusAsync(this HttpClient client, Session actor, Guid orderId, string status) =>
        client.SendAsync(ApiClient.Authed(HttpMethod.Patch, $"/api/v1/orders/{orderId}/status", actor, new { status }));

    public static async Task<OrderBody> MoveAsync(this HttpClient client, Session actor, Guid orderId, string status)
    {
        var response = await client.ChangeStatusAsync(actor, orderId, status);
        Assert.True(response.StatusCode == HttpStatusCode.OK, $"{status}: {await response.Content.ReadAsStringAsync()}");
        return await response.ReadAsync<OrderBody>();
    }

    public static async Task<OrderBody> GetOrderAsync(this HttpClient client, Session viewer, Guid orderId)
    {
        var response = await client.SendAsync(ApiClient.Authed(HttpMethod.Get, $"/api/v1/orders/{orderId}", viewer));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.ReadAsync<OrderBody>();
    }

    /// <summary>Creates a mother, a meal and a customer order, and moves it to READY_FOR_PICKUP.</summary>
    public static async Task<(Session Mother, Session Customer, OrderBody Order)> ReadyOrderAsync(this HttpClient client)
    {
        var mother = await client.RegisterAsync("MOTHER");
        var customer = await client.RegisterAsync("CUSTOMER");
        var meal = await client.CreateMealAsync(mother);
        var order = await client.PlaceAsync(customer, (meal.Id, 2));
        await client.MoveAsync(mother, order.Id, "PREPARING");
        var ready = await client.MoveAsync(mother, order.Id, "READY_FOR_PICKUP");
        return (mother, customer, ready);
    }

    public static async Task<Guid> OpenRequestIdAsync(this HttpClient client, Session courier, Guid orderId)
    {
        var response = await client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/delivery-requests", courier));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var open = await response.ReadAsync<OpenRequestsBody>();
        return open.Items.Single(r => r.OrderId == orderId).Id;
    }

    public static Task<HttpResponseMessage> AcceptAsync(this HttpClient client, Session courier, Guid requestId) =>
        client.SendAsync(ApiClient.Authed(HttpMethod.Post, $"/api/v1/delivery-requests/{requestId}/accept", courier));

    public static async Task<JsonElement> ReadJsonAsync(this HttpResponseMessage response) =>
        await response.ReadAsync<JsonElement>();
}
