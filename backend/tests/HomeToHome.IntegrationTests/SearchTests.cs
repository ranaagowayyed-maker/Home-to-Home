using System.Net;

namespace HomeToHome.IntegrationTests;

[Collection(ApiTestGroup.Name)]
public sealed class SearchTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient(new() { HandleCookies = false });

    /// <summary>A word no other test uses, so results only contain this test's meals.</summary>
    private static string Tag() => "tag" + Guid.NewGuid().ToString("N")[..10];

    private async Task<MealBody> CreateAsync(Session mother, string name, string category, int priceMinor)
    {
        var response = await _client.SendAsync(ApiClient.Authed(HttpMethod.Post, "/api/v1/meals", mother, new
        {
            name,
            description = "Homemade.",
            category,
            priceMinor,
        }));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await response.ReadAsync<MealBody>();
    }

    private async Task<PagedBody<BrowseMealBody>> BrowseAsync(Session customer, string query)
    {
        var response = await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, $"/api/v1/meals?{query}", customer));
        Assert.True(response.StatusCode == HttpStatusCode.OK, await response.Content.ReadAsStringAsync());
        return await response.ReadAsync<PagedBody<BrowseMealBody>>();
    }

    [Fact]
    public async Task Search_matches_name_case_insensitively_and_combines_with_filters()
    {
        var tag = Tag();
        var fatima = await _client.RegisterAsync("MOTHER");
        var cheap = await CreateAsync(fatima, $"Grape Leaves {tag}", "MAIN_DISH", 3000);
        var pricey = await CreateAsync(fatima, $"grape leaves deluxe {tag}", "MAIN_DISH", 9000);
        var dessert = await CreateAsync(fatima, $"Grape jam {tag}", "DESSERT", 2000);
        var sara = await _client.RegisterAsync("CUSTOMER");

        var all = await BrowseAsync(sara, $"q={tag.ToUpperInvariant()}");
        Assert.Equal(3, all.Total);

        var mains = await BrowseAsync(sara, $"q=GRAPE+LEAVES+&category=MAIN_DISH&maxPriceMinor=5000&pageSize=50");
        Assert.Contains(mains.Items, m => m.Id == cheap.Id);
        Assert.DoesNotContain(mains.Items, m => m.Id == pricey.Id || m.Id == dessert.Id);

        var byPrice = await BrowseAsync(sara, $"q={tag}&sort=price_asc");
        Assert.Equal([dessert.Id, cheap.Id, pricey.Id], byPrice.Items.Select(m => m.Id));
        var byPriceDesc = await BrowseAsync(sara, $"q={tag}&sort=price_desc");
        Assert.Equal([pricey.Id, cheap.Id, dessert.Id], byPriceDesc.Items.Select(m => m.Id));
    }

    [Fact]
    public async Task Search_excludes_hidden_archived_and_paused_kitchens()
    {
        var tag = Tag();
        var fatima = await _client.RegisterAsync("MOTHER");
        var visible = await CreateAsync(fatima, $"Koshari {tag}", "MAIN_DISH", 1000);
        var hidden = await CreateAsync(fatima, $"Hidden {tag}", "MAIN_DISH", 1000);
        var archived = await CreateAsync(fatima, $"Archived {tag}", "MAIN_DISH", 1000);
        await _client.SendAsync(ApiClient.Authed(HttpMethod.Patch, $"/api/v1/meals/{hidden.Id}", fatima, new { isVisible = false }));
        await _client.SendAsync(ApiClient.Authed(HttpMethod.Patch, $"/api/v1/meals/{archived.Id}", fatima, new { isArchived = true }));
        var amina = await _client.RegisterAsync("MOTHER");
        await CreateAsync(amina, $"Paused {tag}", "MAIN_DISH", 1000);
        await _client.SendAsync(ApiClient.Authed(HttpMethod.Patch, "/api/v1/mothers/me/availability", amina, new { isAvailable = false }));
        var sara = await _client.RegisterAsync("CUSTOMER");

        var page = await BrowseAsync(sara, $"q={tag}");

        Assert.Equal(visible.Id, Assert.Single(page.Items).Id);
    }

    [Fact]
    public async Task Like_wildcards_in_the_search_are_matched_literally()
    {
        var tag = Tag();
        var fatima = await _client.RegisterAsync("MOTHER");
        var literal = await CreateAsync(fatima, $"100% butter {tag}", "PASTRY", 1000);
        await CreateAsync(fatima, $"100 butter {tag}", "PASTRY", 1000);
        var sara = await _client.RegisterAsync("CUSTOMER");

        var page = await BrowseAsync(sara, $"q={Uri.EscapeDataString("100%")}+butter+{tag}");

        Assert.Equal(literal.Id, Assert.Single(page.Items).Id);
    }

    [Theory]
    [InlineData("category=SOUP", "category")]
    [InlineData("maxPriceMinor=0", "maxPriceMinor")]
    [InlineData("sort=cheapest", "sort")]
    public async Task Invalid_filters_return_422(string query, string field)
    {
        var sara = await _client.RegisterAsync("CUSTOMER");

        var response = await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, $"/api/v1/meals?{query}", sara));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Contains(field, (await response.ReadAsync<ProblemBody>()).Errors!.Keys);
    }
}
