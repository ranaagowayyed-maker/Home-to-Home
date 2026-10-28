using System.Net;

namespace HomeToHome.IntegrationTests;

public sealed record NotificationBody(Guid Id, string Type, string Message, Guid? OrderId, DateTimeOffset CreatedAt, DateTimeOffset? ReadAt);

public sealed record NotificationPageBody(List<NotificationBody> Items, int Page, int PageSize, int Total, int UnreadCount);

[Collection(ApiTestGroup.Name)]
public sealed class NotificationTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient(new() { HandleCookies = false });

    private async Task<NotificationPageBody> ListAsync(Session session)
    {
        var response = await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/notifications", session));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.ReadAsync<NotificationPageBody>();
    }

    private Task<HttpResponseMessage> MarkReadAsync(Session session, Guid id) =>
        _client.SendAsync(ApiClient.Authed(HttpMethod.Post, $"/api/v1/notifications/{id}/read", session));

    [Fact]
    public async Task Order_events_notify_the_parties_and_reading_clears_the_count()
    {
        var (fatima, sara, order) = await _client.ReadyOrderAsync();
        var omar = await _client.RegisterAsync("DELIVERY");
        // Omar registered after the request opened, so only a later request reaches him.
        Assert.DoesNotContain((await ListAsync(omar)).Items, n => n.OrderId == order.Id);

        var mother = await ListAsync(fatima);
        var placed = Assert.Single(mother.Items, n => n.Type == "ORDER_PLACED");
        Assert.Equal(order.Id, placed.OrderId);
        Assert.Equal($"New order #{order.Number}", placed.Message);
        Assert.Equal(1, mother.UnreadCount);

        var customer = await ListAsync(sara);
        Assert.Equal(2, customer.UnreadCount);
        Assert.Equal(
            [$"Order #{order.Number} is ready for pickup", $"Order #{order.Number} is being prepared"],
            customer.Items.Select(n => n.Message));

        var read = await MarkReadAsync(sara, customer.Items[0].Id);
        Assert.Equal(HttpStatusCode.OK, read.StatusCode);
        Assert.NotNull((await read.ReadAsync<NotificationBody>()).ReadAt);
        Assert.Equal(1, (await ListAsync(sara)).UnreadCount);

        // Reading again is harmless.
        Assert.Equal(HttpStatusCode.OK, (await MarkReadAsync(sara, customer.Items[0].Id)).StatusCode);
        Assert.Equal(1, (await ListAsync(sara)).UnreadCount);
    }

    [Fact]
    public async Task Delivery_people_hear_about_new_requests_and_parties_about_acceptance()
    {
        var omar = await _client.RegisterAsync("DELIVERY");
        var (fatima, sara, order) = await _client.ReadyOrderAsync();

        var request = Assert.Single((await ListAsync(omar)).Items, n => n.OrderId == order.Id);
        Assert.Equal("DELIVERY_REQUEST_OPEN", request.Type);

        var requestId = await _client.OpenRequestIdAsync(omar, order.Id);
        Assert.Equal(HttpStatusCode.OK, (await _client.AcceptAsync(omar, requestId)).StatusCode);

        Assert.Contains((await ListAsync(fatima)).Items, n => n.Type == "DELIVERY_ACCEPTED" && n.OrderId == order.Id);
        Assert.Contains((await ListAsync(sara)).Items, n => n.Type == "DELIVERY_ACCEPTED" && n.OrderId == order.Id);
    }

    [Fact]
    public async Task Users_cannot_read_or_mark_someone_elses_notifications()
    {
        var (fatima, _, _) = await _client.ReadyOrderAsync();
        var stranger = await _client.RegisterAsync("CUSTOMER");
        var theirs = (await ListAsync(fatima)).Items[0];

        Assert.Empty((await ListAsync(stranger)).Items);
        Assert.Equal(HttpStatusCode.Forbidden, (await MarkReadAsync(stranger, theirs.Id)).StatusCode);
        Assert.Null((await ListAsync(fatima)).Items[0].ReadAt);
        Assert.Equal(HttpStatusCode.NotFound, (await MarkReadAsync(stranger, Guid.NewGuid())).StatusCode);
    }
}
