using HomeToHome.Application.Abstractions;
using HomeToHome.Application.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace HomeToHome.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(AuthService auth, ICurrentUser currentUser, IOptions<RefreshCookieOptions> cookieOptions)
    : ControllerBase
{
    public sealed record AuthResponse(string AccessToken, DateTimeOffset AccessTokenExpiresAt, UserDto User);

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await auth.RegisterAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, Respond(result));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken) =>
        Respond(await auth.LoginAsync(request, cancellationToken));

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Refresh(CancellationToken cancellationToken) =>
        Respond(await auth.RefreshAsync(Request.Cookies[RefreshCookieOptions.CookieName], cancellationToken));

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        await auth.LogoutAsync(Request.Cookies[RefreshCookieOptions.CookieName], cancellationToken);
        Response.Cookies.Delete(RefreshCookieOptions.CookieName, CookieOptions(expires: null));
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public Task<UserDto> Me(CancellationToken cancellationToken) =>
        auth.GetUserAsync(currentUser.UserId, cancellationToken);

    private AuthResponse Respond(AuthResult result)
    {
        Response.Cookies.Append(
            RefreshCookieOptions.CookieName,
            result.RefreshToken,
            CookieOptions(result.RefreshTokenExpiresAt));
        return new AuthResponse(result.AccessToken.Value, result.AccessToken.ExpiresAt, result.User);
    }

    private CookieOptions CookieOptions(DateTimeOffset? expires) => new()
    {
        HttpOnly = true,
        Secure = cookieOptions.Value.Secure,
        SameSite = cookieOptions.Value.SameSite,
        Path = RefreshCookieOptions.CookiePath,
        Expires = expires,
        IsEssential = true,
    };
}

public sealed class RefreshCookieOptions
{
    public const string SectionName = "RefreshCookie";
    public const string CookieName = "refresh_token";
    public const string CookiePath = "/api/v1/auth";

    public bool Secure { get; set; } = true;

    /// <summary>None when the SPA and API live on different sites (Vercel and Railway); Lax behind a same-origin proxy.</summary>
    public SameSiteMode SameSite { get; set; } = SameSiteMode.None;
}
