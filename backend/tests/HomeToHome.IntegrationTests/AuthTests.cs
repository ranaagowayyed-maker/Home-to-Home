using System.Net;
using System.Net.Http.Json;
using HomeToHome.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeToHome.IntegrationTests;

[Collection(ApiTestGroup.Name)]
public sealed class AuthTests(ApiFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient(new() { HandleCookies = false });

    [Theory]
    [InlineData("CUSTOMER")]
    [InlineData("MOTHER")]
    [InlineData("DELIVERY")]
    public async Task Register_creates_account_with_role_and_issues_tokens(string role)
    {
        var session = await _client.RegisterAsync(role);

        Assert.Equal(role, session.Auth.User.Role);
        Assert.False(string.IsNullOrEmpty(session.Auth.AccessToken));
        Assert.False(string.IsNullOrEmpty(session.RefreshCookie));
        Assert.InRange(
            session.Auth.AccessTokenExpiresAt - DateTimeOffset.UtcNow,
            TimeSpan.FromMinutes(14),
            TimeSpan.FromMinutes(15));
        if (role == "MOTHER")
        {
            Assert.Equal("Fatima's Kitchen", session.Auth.User.KitchenName);
        }
    }

    [Fact]
    public async Task Register_with_existing_email_returns_409()
    {
        var email = ApiClient.UniqueEmail("dup");
        await _client.RegisterAsync("CUSTOMER", email);

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = "Someone",
            email = email.ToUpperInvariant(),
            phone = "+201234567890",
            password = ApiClient.Password,
            role = "CUSTOMER",
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("email_taken", (await response.ReadAsync<ProblemBody>()).Code);
    }

    [Fact]
    public async Task Register_with_invalid_fields_returns_422_with_field_errors()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = "S",
            email = "not-an-email",
            phone = "12",
            password = "short",
            role = "MOTHER",
        });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var problem = await response.ReadAsync<ProblemBody>();
        Assert.Equal("validation_failed", problem.Code);
        Assert.Contains("name", problem.Errors!.Keys);
        Assert.Contains("email", problem.Errors.Keys);
        Assert.Contains("phone", problem.Errors.Keys);
        Assert.Contains("password", problem.Errors.Keys);
        Assert.Contains("kitchenName", problem.Errors.Keys);
    }

    [Fact]
    public async Task Register_with_unknown_role_returns_422()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = "Sara",
            email = ApiClient.UniqueEmail("role"),
            phone = "+201234567890",
            password = ApiClient.Password,
            role = "ADMIN",
        });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Password_is_stored_hashed()
    {
        var session = await _client.RegisterAsync("CUSTOMER");

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.SingleAsync(u => u.Id == session.Auth.User.Id);
        Assert.NotEqual(ApiClient.Password, user.PasswordHash);
        Assert.DoesNotContain(ApiClient.Password, user.PasswordHash, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Login_returns_tokens_and_me_returns_user()
    {
        var registered = await _client.RegisterAsync("DELIVERY");

        var login = await _client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email = registered.Auth.User.Email,
            password = ApiClient.Password,
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var session = await ApiClient.ReadSessionAsync(login);

        var me = await _client.SendAsync(ApiClient.Authed(HttpMethod.Get, "/api/v1/auth/me", session));
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        Assert.Equal(registered.Auth.User.Id, (await me.ReadAsync<TestUser>()).Id);
    }

    [Fact]
    public async Task Wrong_password_returns_401_and_sixth_attempt_is_rate_limited()
    {
        var registered = await _client.RegisterAsync("CUSTOMER");
        var wrong = new { email = registered.Auth.User.Email, password = "Wrong-passw0rd" };

        for (var i = 0; i < 5; i++)
        {
            var response = await _client.PostAsJsonAsync("/api/v1/auth/login", wrong);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            Assert.Equal("invalid_credentials", (await response.ReadAsync<ProblemBody>()).Code);
        }

        var limited = await _client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email = registered.Auth.User.Email,
            password = ApiClient.Password,
        });
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.Equal("rate_limited", (await limited.ReadAsync<ProblemBody>()).Code);
    }

    [Fact]
    public async Task Refresh_rotates_token_and_rejects_the_old_one()
    {
        var session = await _client.RegisterAsync("CUSTOMER");

        var refreshed = await _client.PostWithCookieAsync("/api/v1/auth/refresh", session.RefreshCookie);
        Assert.Equal(HttpStatusCode.OK, refreshed.StatusCode);
        var rotated = ApiClient.RefreshCookieFrom(refreshed);
        Assert.NotNull(rotated);
        Assert.NotEqual(session.RefreshCookie, rotated);

        var replay = await _client.PostWithCookieAsync("/api/v1/auth/refresh", session.RefreshCookie);
        Assert.Equal(HttpStatusCode.Unauthorized, replay.StatusCode);

        // Replaying a revoked token ends every session of that user, including the rotated one.
        var afterReplay = await _client.PostWithCookieAsync("/api/v1/auth/refresh", rotated);
        Assert.Equal(HttpStatusCode.Unauthorized, afterReplay.StatusCode);
    }

    [Fact]
    public async Task Logout_invalidates_refresh_token()
    {
        var session = await _client.RegisterAsync("MOTHER");

        var logout = await _client.PostWithCookieAsync("/api/v1/auth/logout", session.RefreshCookie);
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);

        var refresh = await _client.PostWithCookieAsync("/api/v1/auth/refresh", session.RefreshCookie);
        Assert.Equal(HttpStatusCode.Unauthorized, refresh.StatusCode);
        Assert.Equal("invalid_refresh_token", (await refresh.ReadAsync<ProblemBody>()).Code);
    }

    [Fact]
    public async Task Protected_endpoint_without_token_returns_401()
    {
        var response = await _client.GetAsync("/api/v1/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("unauthenticated", (await response.ReadAsync<ProblemBody>()).Code);
    }

    [Fact]
    public async Task Health_is_anonymous()
    {
        var response = await _client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
