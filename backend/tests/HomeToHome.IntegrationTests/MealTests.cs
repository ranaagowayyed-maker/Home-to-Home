using System.Net;

namespace HomeToHome.IntegrationTests;

[Collection(ApiTestGroup.Name)]
public sealed class MealTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient(new() { HandleCookies = false });

    private static object NewMeal(string name = "Stuffed Grape Leaves", int priceMinor = 4500, string? photoUrl = null) => new
    {
        name,
        description = "Rice and herbs rolled in vine leaves.",
        category = "MAIN_DISH",
        priceMinor,
        photoUrl,
    };

    [Fact]
    public async Task Mother_creates_meal_and_sees_it_in_my_meals()
    {
        var fatima = await _client.RegisterAsync("MOTHER");

        var created = await _client.SendAsync(ApiClient.Authed(HttpMethod.Post, "/api/v1/meals", fatima, NewMeal()));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var meal = await created.ReadAsync<MealBody>();
        Assert.Equal("Stuffed Grape Leaves", meal.Name);
        Assert.Equal("MAIN_DISH", meal.Category);
        Assert.True(meal.IsVisible);
        Assert.False(meal.IsArchived);

        var mine = await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/meals/mine", fatima));
        var page = await mine.ReadAsync<PagedBody<MealBody>>();
        Assert.Equal(1, page.Total);
        Assert.Equal(meal.Id, Assert.Single(page.Items).Id);
    }

    [Theory]
    [InlineData("CUSTOMER")]
    [InlineData("DELIVERY")]
    public async Task Other_roles_cannot_manage_meals(string role)
    {
        var session = await _client.RegisterAsync(role);

        var create = await _client.SendAsync(ApiClient.Authed(HttpMethod.Post, "/api/v1/meals", session, NewMeal()));
        var mine = await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/meals/mine", session));

        Assert.Equal(HttpStatusCode.Forbidden, create.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, mine.StatusCode);
        Assert.Equal("forbidden", (await create.ReadAsync<ProblemBody>()).Code);
    }

    [Theory]
    [InlineData("Ab", 4500, "name")]
    [InlineData("Stuffed Grape Leaves", 0, "priceMinor")]
    [InlineData("Stuffed Grape Leaves", -100, "priceMinor")]
    public async Task Invalid_meal_is_rejected_with_422(string name, int priceMinor, string field)
    {
        var fatima = await _client.RegisterAsync("MOTHER");

        var response = await _client.SendAsync(
            ApiClient.Authed(HttpMethod.Post, "/api/v1/meals", fatima, NewMeal(name, priceMinor)));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Contains(field, (await response.ReadAsync<ProblemBody>()).Errors!.Keys);
    }

    [Fact]
    public async Task Mother_can_edit_hide_and_archive_her_meal()
    {
        var fatima = await _client.RegisterAsync("MOTHER");
        var meal = await (await _client.SendAsync(
            ApiClient.Authed(HttpMethod.Post, "/api/v1/meals", fatima, NewMeal()))).ReadAsync<MealBody>();

        var edited = await (await _client.SendAsync(ApiClient.Authed(
            HttpMethod.Patch, $"/api/v1/meals/{meal.Id}", fatima, new { priceMinor = 5000, isVisible = false })))
            .ReadAsync<MealBody>();
        Assert.Equal(5000, edited.PriceMinor);
        Assert.False(edited.IsVisible);
        Assert.Equal(meal.Name, edited.Name);

        var archived = await _client.SendAsync(ApiClient.Authed(
            HttpMethod.Patch, $"/api/v1/meals/{meal.Id}", fatima, new { isArchived = true }));
        Assert.Equal(HttpStatusCode.OK, archived.StatusCode);

        var mine = await (await _client.SendAsync(
            ApiClient.Authed(HttpMethod.Get, "/api/v1/meals/mine", fatima))).ReadAsync<PagedBody<MealBody>>();
        Assert.Empty(mine.Items);
        var withArchived = await (await _client.SendAsync(
            ApiClient.Authed(HttpMethod.Get, "/api/v1/meals/mine?includeArchived=true", fatima)))
            .ReadAsync<PagedBody<MealBody>>();
        Assert.True(Assert.Single(withArchived.Items).IsArchived);
    }

    [Fact]
    public async Task Mother_cannot_edit_another_mothers_meal()
    {
        var fatima = await _client.RegisterAsync("MOTHER");
        var other = await _client.RegisterAsync("MOTHER", kitchenName: "Huda's Kitchen");
        var meal = await (await _client.SendAsync(
            ApiClient.Authed(HttpMethod.Post, "/api/v1/meals", fatima, NewMeal()))).ReadAsync<MealBody>();

        var response = await _client.SendAsync(ApiClient.Authed(
            HttpMethod.Patch, $"/api/v1/meals/{meal.Id}", other, new { name = "Taken over" }));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Editing_unknown_meal_returns_404()
    {
        var fatima = await _client.RegisterAsync("MOTHER");

        var response = await _client.SendAsync(ApiClient.Authed(
            HttpMethod.Patch, $"/api/v1/meals/{Guid.NewGuid()}", fatima, new { name = "Nothing here" }));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Upload_url_is_scoped_to_the_mother_and_photo_is_accepted_on_create()
    {
        var fatima = await _client.RegisterAsync("MOTHER");

        var upload = await _client.SendAsync(ApiClient.Authed(
            HttpMethod.Post, "/api/v1/meals/upload-url", fatima, new { contentType = "image/png", size = 1024 }));
        Assert.Equal(HttpStatusCode.OK, upload.StatusCode);
        var body = await upload.ReadAsync<Dictionary<string, string>>();
        Assert.StartsWith($"{ApiFactory.PhotoBaseUrl}/meals/{fatima.Auth.User.Id}/", body["photoUrl"], StringComparison.Ordinal);
        Assert.Contains("X-Amz-Signature", body["uploadUrl"], StringComparison.Ordinal);

        var created = await _client.SendAsync(ApiClient.Authed(
            HttpMethod.Post, "/api/v1/meals", fatima, NewMeal(photoUrl: body["photoUrl"])));
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
    }

    [Fact]
    public async Task Photo_from_another_mother_is_rejected()
    {
        var fatima = await _client.RegisterAsync("MOTHER");
        var foreignPhoto = $"{ApiFactory.PhotoBaseUrl}/meals/{Guid.NewGuid()}/photo.jpg";

        var response = await _client.SendAsync(ApiClient.Authed(
            HttpMethod.Post, "/api/v1/meals", fatima, NewMeal(photoUrl: foreignPhoto)));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Contains("photoUrl", (await response.ReadAsync<ProblemBody>()).Errors!.Keys);
    }

    [Theory]
    [InlineData("image/gif", 1024)]
    [InlineData("image/jpeg", 6 * 1024 * 1024)]
    public async Task Upload_url_rejects_wrong_type_or_size(string contentType, long size)
    {
        var fatima = await _client.RegisterAsync("MOTHER");

        var response = await _client.SendAsync(ApiClient.Authed(
            HttpMethod.Post, "/api/v1/meals/upload-url", fatima, new { contentType, size }));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }
}
