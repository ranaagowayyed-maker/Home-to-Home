using HomeToHome.Api.Authorization;
using HomeToHome.Application.Abstractions;
using HomeToHome.Application.Common;
using HomeToHome.Application.Meals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeToHome.Api.Controllers;

[ApiController]
[Route("api/v1/meals")]
[Authorize(Policy = Policies.MotherOnly)]
public sealed class MealsController(MealService meals) : ControllerBase
{
    [HttpPost("upload-url")]
    public Task<PhotoUpload> CreateUploadUrl(PhotoUploadRequest request, CancellationToken cancellationToken) =>
        meals.CreatePhotoUploadAsync(request, cancellationToken);

    [HttpPost]
    public async Task<ActionResult<MealDto>> Create(CreateMealRequest request, CancellationToken cancellationToken)
    {
        var meal = await meals.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, meal);
    }

    [HttpGet("mine")]
    public Task<Paged<MealDto>> ListMine(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PageRequest.MaxPageSize,
        [FromQuery] bool includeArchived = false,
        CancellationToken cancellationToken = default) =>
        meals.ListMineAsync(new PageRequest(page, pageSize), includeArchived, cancellationToken);

    [HttpPatch("{id:guid}")]
    public Task<MealDto> Update(Guid id, UpdateMealRequest request, CancellationToken cancellationToken) =>
        meals.UpdateAsync(id, request, cancellationToken);
}
