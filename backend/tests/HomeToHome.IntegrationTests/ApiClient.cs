using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace HomeToHome.IntegrationTests;

public sealed record TestUser(Guid Id, string Name, string Email, string Role, string? KitchenName);

public sealed record AuthBody(string AccessToken, DateTimeOffset AccessTokenExpiresAt, TestUser User);

public sealed record MealBody(
    Guid Id,
    string Name,
    string Description,
    string Category,
    int PriceMinor,
    string? PhotoUrl,
    bool IsVisible,
    bool IsArchived);

public sealed record PagedBody<T>(List<T> Items, int Page, int PageSize, int Total);

public sealed record ProblemBody(int Status, string Code, Dictionary<string, string[]>? Errors);

public sealed record Session(AuthBody Auth, string RefreshCookie);

/// <summary>Small helpers over HttpClient; cookies are handled by hand so each test controls exactly what is sent.</summary>
public static class ApiClient
{
    public const string Password = "Passw0rd!";

    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseUpper) },
    };

    public static string UniqueEmail(string prefix) => $"{prefix}-{Guid.NewGuid():N}@example.test";

    public static async Task<Session> RegisterAsync(
        this HttpClient client,
        string role,
        string? email = null,
        string? kitchenName = null)
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = "Test " + role.ToLowerInvariant(),
            email = email ?? UniqueEmail(role.ToLowerInvariant()),
            phone = "+201234567890",
            password = Password,
            role,
            kitchenName = role == "MOTHER" ? kitchenName ?? "Fatima's Kitchen" : null,
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await ReadSessionAsync(response);
    }

    public static async Task<Session> ReadSessionAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadFromJsonAsync<AuthBody>(Json);
        return new Session(body!, RefreshCookieFrom(response)!);
    }

    public static string? RefreshCookieFrom(HttpResponseMessage response) =>
        response.Headers.TryGetValues("Set-Cookie", out var cookies)
            ? cookies
                .Select(c => c.Split(';')[0])
                .Where(c => c.StartsWith("refresh_token=", StringComparison.Ordinal))
                .Select(c => c["refresh_token=".Length..])
                .FirstOrDefault(c => c.Length > 0)
            : null;

    public static Task<HttpResponseMessage> PostWithCookieAsync(this HttpClient client, string url, string refreshCookie)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Cookie", $"refresh_token={refreshCookie}");
        return client.SendAsync(request);
    }

    public static HttpRequestMessage Authed(HttpMethod method, string url, Session session, object? body = null)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", session.Auth.AccessToken);
        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }

        return request;
    }

    public static async Task<T> ReadAsync<T>(this HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<T>(Json))!;
}
