using HomeToHome.Api.Authorization;
using HomeToHome.Application.Profiles;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeToHome.Api.Controllers;

[ApiController]
[Route("api/v1/mothers")]
[Authorize(Policy = Policies.MotherOnly)]
public sealed class MothersController(ProfileService profiles) : ControllerBase
{
    [HttpPatch("me/availability")]
    public Task<AvailabilityDto> SetAvailability(UpdateAvailabilityRequest request, CancellationToken cancellationToken) =>
        profiles.SetAvailabilityAsync(request, cancellationToken);
}
