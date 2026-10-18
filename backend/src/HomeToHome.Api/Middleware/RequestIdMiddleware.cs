namespace HomeToHome.Api.Middleware;

/// <summary>Echoes or assigns an X-Request-Id and adds it, with the user and route, to the logging scope.</summary>
public sealed class RequestIdMiddleware(RequestDelegate next, ILogger<RequestIdMiddleware> logger)
{
    public const string HeaderName = "X-Request-Id";

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = context.Request.Headers[HeaderName].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(requestId) || requestId.Length > 64)
        {
            requestId = Guid.NewGuid().ToString("N");
        }

        context.TraceIdentifier = requestId;
        context.Response.Headers[HeaderName] = requestId;
        using (logger.BeginScope(new Dictionary<string, object> { ["RequestId"] = requestId, ["Path"] = context.Request.Path.Value ?? string.Empty }))
        {
            await next(context);
        }
    }
}
