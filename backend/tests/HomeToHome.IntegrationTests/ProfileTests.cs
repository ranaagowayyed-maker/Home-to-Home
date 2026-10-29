using System.Net;
using System.Text.Json;

namespace HomeToHome.IntegrationTests;

[Collection(ApiTestGroup.Name)]
public sealed class ProfileTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient(new() { HandleCookies = false });

    private Task<HttpResponseMessage> PatchAsync(Session session, object body) =>
        _client.SendAsync(ApiClient.Authed(HttpMethod.Patch, "/api/v1/users/me", session, body));

    private Task<HttpResponseMessage> SetAvailabilityAsync(Session session, bool isAvailable) =>
        _client.SendAsync(ApiClient.Authed(HttpMethod.Patch, "/api/v1/mothers/me/availability", session, new { isAvailable }));

    [Fact]
    public async Task Customer_saves_address_and_phone_and_reads_them_back()
    {
        var sara = await _client.RegisterAsync("CUSTOMER");

        var response = await PatchAsync(sara, new { name = "Sara Ali", phone = "+201111111111", address = "12 Nile Street", city = "Cairo" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var me = await (await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/users/me", sara))).ReadJsonAsync();
        Assert.Equal("Sara Ali", me.GetProperty("name").GetString());
        Assert.Equal("+201111111111", me.GetProperty("phone").GetString());
        Assert.Equal("12 Nile Street", me.GetProperty("address").GetString());
        Assert.Equal("Cairo", me.GetProperty("city").GetString());
        Assert.Equal(sara.Auth.User.Email, me.GetProperty("email").GetString());
        Assert.Equal(JsonValueKind.Null, me.GetProperty("kitchenName").ValueKind);

        // Omitted fields are left alone and an empty string clears an optional one.
        var cleared = await (await PatchAsync(sara, new { city = "" })).ReadJsonAsync();
        Assert.Equal(JsonValueKind.Null, cleared.GetProperty("city").ValueKind);
        Assert.Equal("12 Nile Street", cleared.GetProperty("address").GetString());
    }

    [Theory]
    [InlineData("email", "new@example.test")]
    [InlineData("role", "MOTHER")]
    public async Task Email_and_role_cannot_be_changed(string field, string value)
    {
        var sara = await _client.RegisterAsync("CUSTOMER");

        var response = await PatchAsync(sara, new Dictionary<string, string> { [field] = value });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Contains(field, (await response.ReadAsync<ProblemBody>()).Errors!.Keys);
        var me = await (await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/auth/me", sara))).ReadAsync<TestUser>();
        Assert.Equal(sara.Auth.User.Email, me.Email);
        Assert.Equal("CUSTOMER", me.Role);
    }

    [Theory]
    [InlineData("phone", "not a phone")]
    [InlineData("name", " ")]
    public async Task Invalid_fields_are_rejected_and_nothing_is_saved(string field, string value)
    {
        var sara = await _client.RegisterAsync("CUSTOMER");

        var response = await PatchAsync(sara, new Dictionary<string, string> { [field] = value, ["city"] = "Giza" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Contains(field, (await response.ReadAsync<ProblemBody>()).Errors!.Keys);
        var me = await (await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/users/me", sara))).ReadJsonAsync();
        Assert.Equal(JsonValueKind.Null, me.GetProperty("city").ValueKind);
    }

    [Fact]
    public async Task Mother_edits_kitchen_name_and_bio_but_other_roles_cannot()
    {
        var fatima = await _client.RegisterAsync("MOTHER");
        var omar = await _client.RegisterAsync("DELIVERY");

        var updated = await (await PatchAsync(fatima, new { kitchenName = "Fatima's Home Kitchen", bio = "Cairo recipes." })).ReadJsonAsync();
        var refused = await PatchAsync(omar, new { kitchenName = "Omar's Kitchen" });
        var tooShort = await PatchAsync(fatima, new { kitchenName = "Ab" });

        Assert.Equal("Fatima's Home Kitchen", updated.GetProperty("kitchenName").GetString());
        Assert.Equal("Cairo recipes.", updated.GetProperty("bio").GetString());
        Assert.True(updated.GetProperty("isAvailable").GetBoolean());
        Assert.Equal(HttpStatusCode.UnprocessableEntity, refused.StatusCode);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, tooShort.StatusCode);
    }

    [Fact]
    public async Task Profile_requires_login()
    {
        var response = await _client.GetAsync("/api/v1/users/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Paused_kitchen_refuses_new_orders_but_keeps_orders_in_progress()
    {
        var fatima = await _client.RegisterAsync("MOTHER");
        var meal = await _client.CreateMealAsync(fatima);
        var sara = await _client.RegisterAsync("CUSTOMER");
        var placed = await _client.PlaceAsync(sara, (meal.Id, 1));

        var paused = await SetAvailabilityAsync(fatima, isAvailable: false);
        Assert.Equal(HttpStatusCode.OK, paused.StatusCode);
        Assert.False((await paused.ReadJsonAsync()).GetProperty("isAvailable").GetBoolean());

        var refused = await _client.SendAsync(OrderFlow.PlaceRequest(
            sara, new[] { new { mealId = meal.Id, quantity = 1 } }, Guid.NewGuid().ToString()));
        Assert.Equal(HttpStatusCode.Conflict, refused.StatusCode);
        var problem = await refused.ReadJsonAsync();
        Assert.Equal("kitchen_paused", problem.GetProperty("code").GetString());
        Assert.Equal(meal.Id, problem.GetProperty("unavailableMealIds")[0].GetGuid());

        // The order placed before the pause still moves forward.
        await _client.MoveAsync(fatima, placed.Id, "PREPARING");

        var meBody = await (await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/users/me", fatima))).ReadJsonAsync();
        Assert.False(meBody.GetProperty("isAvailable").GetBoolean());

        await SetAvailabilityAsync(fatima, isAvailable: true);
        await _client.PlaceAsync(sara, (meal.Id, 1));
    }

    [Theory]
    [InlineData("CUSTOMER")]
    [InlineData("DELIVERY")]
    public async Task Only_mothers_change_availability(string role)
    {
        var session = await _client.RegisterAsync(role);

        var response = await SetAvailabilityAsync(session, isAvailable: false);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Availability_requires_a_value()
    {
        var fatima = await _client.RegisterAsync("MOTHER");

        var response = await _client.SendAsync(
            ApiClient.Authed(HttpMethod.Patch, "/api/v1/mothers/me/availability", fatima, new { }));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }
}
