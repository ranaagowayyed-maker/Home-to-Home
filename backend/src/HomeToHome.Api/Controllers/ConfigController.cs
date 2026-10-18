using HomeToHome.Application.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace HomeToHome.Api.Controllers;

[ApiController]
[Route("api/v1/config")]
[AllowAnonymous]
public sealed class ConfigController(IOptions<OrderingOptions> options) : ControllerBase
{
    public sealed record ClientConfig(int DeliveryFeeMinor, string Currency);

    [HttpGet]
    public ClientConfig Get() => new(options.Value.DeliveryFeeMinor, options.Value.Currency);
}
