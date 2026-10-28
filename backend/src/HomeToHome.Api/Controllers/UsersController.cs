using HomeToHome.Application.Auth;
using HomeToHome.Application.Profiles;
using Microsoft.AspNetCore.Mvc;

namespace HomeToHome.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
public sealed class UsersController(ProfileService profiles) : ControllerBase
{
    [HttpGet("me")]
    public Task<UserDto> Get(CancellationToken cancellationToken) => profiles.GetAsync(cancellationToken);

    [HttpPatch("me")]
    public Task<UserDto> Update(UpdateProfileRequest request, CancellationToken cancellationToken) =>
        profiles.UpdateAsync(request, cancellationToken);
}
