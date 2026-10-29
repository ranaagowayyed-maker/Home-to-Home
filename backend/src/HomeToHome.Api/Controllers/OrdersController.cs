using HomeToHome.Api.Authorization;
using HomeToHome.Application.Common;
using HomeToHome.Application.Orders;
using HomeToHome.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeToHome.Api.Controllers;

[ApiController]
[Route("api/v1/orders")]
public sealed class OrdersController(OrderService orders) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = Policies.CustomerOnly)]
    public async Task<ActionResult<OrderDetailDto>> Place(
        PlaceOrderRequest request,
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
        CancellationToken cancellationToken)
    {
        var result = await orders.PlaceAsync(idempotencyKey, request, cancellationToken);
        return result.Created ? StatusCode(StatusCodes.Status201Created, result.Order) : Ok(result.Order);
    }

    [HttpGet]
    public Task<Paged<OrderSummaryDto>> List(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PageRequest.DefaultPageSize,
        CancellationToken cancellationToken = default) =>
        orders.ListAsync(StatusFilter.Parse(status), new PageRequest(page, pageSize), cancellationToken);

    [HttpGet("{id:guid}")]
    public Task<OrderDetailDto> Get(Guid id, CancellationToken cancellationToken) =>
        orders.GetAsync(id, cancellationToken);

    [HttpPatch("{id:guid}/status")]
    public Task<OrderDetailDto> ChangeStatus(Guid id, ChangeStatusRequest request, CancellationToken cancellationToken) =>
        orders.ChangeStatusAsync(id, request, cancellationToken);
}

internal static class StatusFilter
{
    /// <summary>Parses a comma-separated list such as <c>PLACED,READY_FOR_PICKUP</c>.</summary>
    public static IReadOnlyCollection<OrderStatus> Parse(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return [];
        }

        var statuses = new List<OrderStatus>();
        foreach (var part in value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!Enum.TryParse<OrderStatus>(part.Replace("_", string.Empty, StringComparison.Ordinal), ignoreCase: true, out var status)
                || !Enum.IsDefined(status))
            {
                throw new Domain.Errors.ValidationException(new Dictionary<string, string[]>
                {
                    ["status"] = [$"Unknown status '{part}'."],
                });
            }

            statuses.Add(status);
        }

        return statuses;
    }
}
