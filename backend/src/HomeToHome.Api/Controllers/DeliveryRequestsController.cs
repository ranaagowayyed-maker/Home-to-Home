using HomeToHome.Api.Authorization;
using HomeToHome.Application.Common;
using HomeToHome.Application.Deliveries;
using HomeToHome.Application.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeToHome.Api.Controllers;

[ApiController]
[Route("api/v1/delivery-requests")]
[Authorize(Policy = Policies.DeliveryOnly)]
public sealed class DeliveryRequestsController(DeliveryService deliveries) : ControllerBase
{
    [HttpGet]
    public Task<OpenDeliveryRequestsDto> ListOpen(CancellationToken cancellationToken) =>
        deliveries.ListOpenAsync(cancellationToken);

    [HttpPost("{id:guid}/accept")]
    public Task<OrderDetailDto> Accept(Guid id, CancellationToken cancellationToken) =>
        deliveries.AcceptAsync(id, cancellationToken);

    [HttpGet("mine")]
    public Task<Paged<OrderSummaryDto>> ListMine(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PageRequest.DefaultPageSize,
        CancellationToken cancellationToken = default) =>
        deliveries.ListMineAsync(new PageRequest(page, pageSize), cancellationToken);
}
