using System.Net;

namespace HomeToHome.IntegrationTests;

[Collection(ApiTestGroup.Name)]
public sealed class OrderTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient(new() { HandleCookies = false });

    [Fact]
    public async Task Placing_an_order_snapshots_prices_and_adds_the_delivery_fee()
    {
        var fatima = await _client.RegisterAsync("MOTHER");
        var koshari = await _client.CreateMealAsync(fatima, "Koshari", 950);
        var molokhia = await _client.CreateMealAsync(fatima, "Molokhia", 4500);
        var sara = await _client.RegisterAsync("CUSTOMER");

        var order = await _client.PlaceAsync(sara, (koshari.Id, 2), (molokhia.Id, 1));

        Assert.Equal("PLACED", order.Status);
        Assert.Equal("CASH_ON_DELIVERY", order.PaymentMethod);
        Assert.True(order.Number >= 1000);
        Assert.Equal(6400, order.SubtotalMinor);
        Assert.Equal(1500, order.DeliveryFeeMinor);
        Assert.Equal(7900, order.TotalMinor);
        Assert.Equal(["CANCELLED"], order.AllowedActions);
        Assert.Equal("PLACED", Assert.Single(order.Timeline).Status);

        // A later price change does not touch the order.
        await _client.SendAsync(ApiClient.Authed(HttpMethod.Patch, $"/api/v1/meals/{koshari.Id}", fatima, new { priceMinor = 2000 }));
        var reread = await _client.GetOrderAsync(sara, order.Id);
        Assert.Equal(950, reread.Items.Single(i => i.MealId == koshari.Id).UnitPriceMinor);
        Assert.Equal(7900, reread.TotalMinor);

        var incoming = await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/orders?status=PLACED", fatima));
        Assert.Equal(order.Id, Assert.Single((await incoming.ReadAsync<PagedBody<OrderSummaryBody>>()).Items).Id);
    }

    [Fact]
    public async Task Same_idempotency_key_returns_the_same_order()
    {
        var fatima = await _client.RegisterAsync("MOTHER");
        var meal = await _client.CreateMealAsync(fatima);
        var sara = await _client.RegisterAsync("CUSTOMER");
        var key = Guid.NewGuid().ToString();
        object[] items = [new { mealId = meal.Id, quantity = 1 }];

        var first = await _client.SendAsync(OrderFlow.PlaceRequest(sara, items, key));
        var second = await _client.SendAsync(OrderFlow.PlaceRequest(sara, items, key));

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Equal((await first.ReadAsync<OrderBody>()).Id, (await second.ReadAsync<OrderBody>()).Id);

        var mine = await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/orders", sara));
        Assert.Equal(1, (await mine.ReadAsync<PagedBody<OrderSummaryBody>>()).Total);
    }

    [Fact]
    public async Task Missing_idempotency_key_is_rejected()
    {
        var fatima = await _client.RegisterAsync("MOTHER");
        var meal = await _client.CreateMealAsync(fatima);
        var sara = await _client.RegisterAsync("CUSTOMER");

        var response = await _client.SendAsync(
            OrderFlow.PlaceRequest(sara, new[] { new { mealId = meal.Id, quantity = 1 } }, idempotencyKey: null));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Contains("idempotencyKey", (await response.ReadAsync<ProblemBody>()).Errors!.Keys);
    }

    [Fact]
    public async Task Unavailable_meal_returns_409_with_its_id()
    {
        var fatima = await _client.RegisterAsync("MOTHER");
        var meal = await _client.CreateMealAsync(fatima);
        await _client.SendAsync(ApiClient.Authed(HttpMethod.Patch, $"/api/v1/meals/{meal.Id}", fatima, new { isVisible = false }));
        var sara = await _client.RegisterAsync("CUSTOMER");

        var response = await _client.SendAsync(
            OrderFlow.PlaceRequest(sara, new[] { new { mealId = meal.Id, quantity = 1 } }, Guid.NewGuid().ToString()));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var body = await response.ReadJsonAsync();
        Assert.Equal("meal_unavailable", body.GetProperty("code").GetString());
        Assert.Equal(meal.Id, body.GetProperty("unavailableMealIds")[0].GetGuid());
    }

    [Fact]
    public async Task Meals_from_two_kitchens_cannot_share_an_order()
    {
        var first = await _client.CreateMealAsync(await _client.RegisterAsync("MOTHER"));
        var second = await _client.CreateMealAsync(await _client.RegisterAsync("MOTHER"));
        var sara = await _client.RegisterAsync("CUSTOMER");

        var response = await _client.SendAsync(OrderFlow.PlaceRequest(
            sara,
            new[] { new { mealId = first.Id, quantity = 1 }, new { mealId = second.Id, quantity = 1 } },
            Guid.NewGuid().ToString()));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Contains("items", (await response.ReadAsync<ProblemBody>()).Errors!.Keys);
    }

    [Theory]
    [InlineData("MOTHER")]
    [InlineData("DELIVERY")]
    public async Task Only_customers_place_orders(string role)
    {
        var meal = await _client.CreateMealAsync(await _client.RegisterAsync("MOTHER"));
        var session = await _client.RegisterAsync(role);

        var response = await _client.SendAsync(
            OrderFlow.PlaceRequest(session, new[] { new { mealId = meal.Id, quantity = 1 } }, Guid.NewGuid().ToString()));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Mother_rejects_and_customer_can_no_longer_cancel()
    {
        var fatima = await _client.RegisterAsync("MOTHER");
        var sara = await _client.RegisterAsync("CUSTOMER");
        var order = await _client.PlaceAsync(sara, ((await _client.CreateMealAsync(fatima)).Id, 1));

        var rejected = await _client.MoveAsync(fatima, order.Id, "REJECTED");
        var cancel = await _client.ChangeStatusAsync(sara, order.Id, "CANCELLED");

        Assert.Equal("REJECTED", rejected.Status);
        Assert.Empty(rejected.AllowedActions);
        Assert.Equal(HttpStatusCode.Conflict, cancel.StatusCode);
        Assert.Equal("invalid_transition", (await cancel.ReadAsync<ProblemBody>()).Code);
    }

    [Fact]
    public async Task Customer_cancels_a_placed_order_but_not_a_preparing_one()
    {
        var fatima = await _client.RegisterAsync("MOTHER");
        var sara = await _client.RegisterAsync("CUSTOMER");
        var meal = await _client.CreateMealAsync(fatima);
        var first = await _client.PlaceAsync(sara, (meal.Id, 1));
        var second = await _client.PlaceAsync(sara, (meal.Id, 1));

        Assert.Equal("CANCELLED", (await _client.MoveAsync(sara, first.Id, "CANCELLED")).Status);

        await _client.MoveAsync(fatima, second.Id, "PREPARING");
        var late = await _client.ChangeStatusAsync(sara, second.Id, "CANCELLED");
        Assert.Equal(HttpStatusCode.Conflict, late.StatusCode);
    }

    [Fact]
    public async Task Customer_cannot_move_kitchen_steps()
    {
        var fatima = await _client.RegisterAsync("MOTHER");
        var sara = await _client.RegisterAsync("CUSTOMER");
        var order = await _client.PlaceAsync(sara, ((await _client.CreateMealAsync(fatima)).Id, 1));

        var response = await _client.ChangeStatusAsync(sara, order.Id, "PREPARING");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Strangers_cannot_read_or_change_an_order()
    {
        var fatima = await _client.RegisterAsync("MOTHER");
        var sara = await _client.RegisterAsync("CUSTOMER");
        var order = await _client.PlaceAsync(sara, ((await _client.CreateMealAsync(fatima)).Id, 1));
        var otherCustomer = await _client.RegisterAsync("CUSTOMER");
        var otherMother = await _client.RegisterAsync("MOTHER");

        var read = await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, $"/api/v1/orders/{order.Id}", otherCustomer));
        var move = await _client.ChangeStatusAsync(otherMother, order.Id, "PREPARING");

        Assert.Equal(HttpStatusCode.Forbidden, read.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, move.StatusCode);
    }

    [Fact]
    public async Task Unknown_status_filter_is_rejected()
    {
        var sara = await _client.RegisterAsync("CUSTOMER");

        var response = await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/orders?status=EATEN", sara));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }
}
