using System.Net;

namespace HomeToHome.IntegrationTests;

[Collection(ApiTestGroup.Name)]
public sealed class DeliveryTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient(new() { HandleCookies = false });

    [Fact]
    public async Task Courier_accepts_picks_up_and_delivers()
    {
        var (mother, customer, order) = await _client.ReadyOrderAsync();
        var omar = await _client.RegisterAsync("DELIVERY");
        var requestId = await _client.OpenRequestIdAsync(omar, order.Id);

        var accepted = await _client.AcceptAsync(omar, requestId);
        Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
        var assigned = await accepted.ReadAsync<OrderBody>();
        Assert.Equal(["OUT_FOR_DELIVERY"], assigned.AllowedActions);

        var customerView = await _client.GetOrderAsync(customer, order.Id);
        Assert.NotNull(customerView.DeliveryPerson);

        await _client.MoveAsync(omar, order.Id, "OUT_FOR_DELIVERY");
        var delivered = await _client.MoveAsync(omar, order.Id, "DELIVERED");

        Assert.Equal("DELIVERED", delivered.Status);
        Assert.Equal(
            ["PLACED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"],
            delivered.Timeline.Select(t => t.Status));

        var mine = await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/delivery-requests/mine", omar));
        Assert.Equal(HttpStatusCode.OK, mine.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _client.SendAsync(
            ApiClient.Authed(HttpMethod.Get, $"/api/v1/orders/{order.Id}", mother))).StatusCode);
    }

    [Fact]
    public async Task Open_request_hides_the_customer_until_accepted()
    {
        var (_, _, order) = await _client.ReadyOrderAsync();
        var omar = await _client.RegisterAsync("DELIVERY");

        var beforeAccept = await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, $"/api/v1/orders/{order.Id}", omar));

        Assert.Equal(HttpStatusCode.Forbidden, beforeAccept.StatusCode);
    }

    [Fact]
    public async Task Two_couriers_racing_for_one_request_get_one_winner()
    {
        var (_, _, order) = await _client.ReadyOrderAsync();
        var omar = await _client.RegisterAsync("DELIVERY");
        var youssef = await _client.RegisterAsync("DELIVERY");
        var requestId = await _client.OpenRequestIdAsync(omar, order.Id);

        var responses = await Task.WhenAll(_client.AcceptAsync(omar, requestId), _client.AcceptAsync(youssef, requestId));

        Assert.Single(responses, r => r.StatusCode == HttpStatusCode.OK);
        var loser = Assert.Single(responses, r => r.StatusCode == HttpStatusCode.Conflict);
        Assert.Equal("delivery_taken", (await loser.ReadAsync<ProblemBody>()).Code);
    }

    [Fact]
    public async Task Courier_with_three_active_deliveries_cannot_accept_a_fourth()
    {
        var omar = await _client.RegisterAsync("DELIVERY");
        for (var i = 0; i < 3; i++)
        {
            var (_, _, active) = await _client.ReadyOrderAsync();
            var accepted = await _client.AcceptAsync(omar, await _client.OpenRequestIdAsync(omar, active.Id));
            Assert.Equal(HttpStatusCode.OK, accepted.StatusCode);
        }

        var (_, _, fourth) = await _client.ReadyOrderAsync();
        var fourthRequest = await _client.OpenRequestIdAsync(omar, fourth.Id);
        var response = await _client.AcceptAsync(omar, fourthRequest);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("active_limit", (await response.ReadAsync<ProblemBody>()).Code);

        // The request stays open for someone else.
        var youssef = await _client.RegisterAsync("DELIVERY");
        Assert.Equal(HttpStatusCode.OK, (await _client.AcceptAsync(youssef, fourthRequest)).StatusCode);
    }

    [Fact]
    public async Task Another_courier_cannot_move_an_assigned_order()
    {
        var (_, _, order) = await _client.ReadyOrderAsync();
        var omar = await _client.RegisterAsync("DELIVERY");
        await _client.AcceptAsync(omar, await _client.OpenRequestIdAsync(omar, order.Id));
        var youssef = await _client.RegisterAsync("DELIVERY");

        var response = await _client.ChangeStatusAsync(youssef, order.Id, "OUT_FOR_DELIVERY");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Theory]
    [InlineData("CUSTOMER")]
    [InlineData("MOTHER")]
    public async Task Only_couriers_see_delivery_requests(string role)
    {
        var session = await _client.RegisterAsync(role);

        var response = await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/delivery-requests", session));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
