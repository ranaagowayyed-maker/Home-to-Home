using HomeToHome.Api.Authorization;
using HomeToHome.Application.Abstractions;
using HomeToHome.Application.Common;
using HomeToHome.Application.Meals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeToHome.Api.Controllers;

[ApiController]
[Route("api/v1/meals")]
public sealed class MealsController(MealService meals) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = Policies.CustomerOnly)]
    public Task<Paged<BrowseMealDto>> Browse(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PageRequest.DefaultPageSize,
        CancellationToken cancellationToken = default) =>
        meals.BrowseAsync(new PageRequest(page, pageSize), cancellationToken);

    [HttpGet("{id:guid}")]
    [Authorize(Policy = Policies.CustomerOnly)]
    public Task<BrowseMealDto> Get(Guid id, CancellationToken cancellationToken) =>
        meals.GetBrowsableAsync(id, cancellationToken);

    [HttpPost("upload-url")]
    [Authorize(Policy = Policies.MotherOnly)]
    public Task<PhotoUpload> CreateUploadUrl(PhotoUploadRequest request, CancellationToken cancellationToken) =>
        meals.CreatePhotoUploadAsync(request, cancellationToken);

    [HttpPost]
    [Authorize(Policy = Policies.MotherOnly)]
    public async Task<ActionResult<MealDto>> Create(CreateMealRequest request, CancellationToken cancellationToken)
    {
        var meal = await meals.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, meal);
    }

    [HttpGet("mine")]
    [Authorize(Policy = Policies.MotherOnly)]
    public Task<Paged<MealDto>> ListMine(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PageRequest.MaxPageSize,
        [FromQuery] bool includeArchived = false,
        CancellationToken cancellationToken = default) =>
        meals.ListMineAsync(new PageRequest(page, pageSize), includeArchived, cancellationToken);

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = Policies.MotherOnly)]
    public Task<MealDto> Update(Guid id, UpdateMealRequest request, CancellationToken cancellationToken) =>
        meals.UpdateAsync(id, request, cancellationToken);
}
