using HomeToHome.Application.Abstractions;
using HomeToHome.Domain.Enums;
using HomeToHome.Domain.Errors;
using HomeToHome.Infrastructure.Auth;
using Microsoft.IdentityModel.JsonWebTokens;

namespace HomeToHome.Api.Authorization;

public sealed class HttpCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid UserId =>
        Guid.TryParse(Principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var id)
            ? id
            : throw Unauthenticated();

    public Role Role =>
        RoleNames.FromClaim(Principal.FindFirst(JwtTokenService.RoleClaim)?.Value) ?? throw Unauthenticated();

    private System.Security.Claims.ClaimsPrincipal Principal =>
        accessor.HttpContext?.User ?? throw Unauthenticated();

    private static UnauthenticatedException Unauthenticated() =>
        new("unauthenticated", "Log in to continue.");
}
