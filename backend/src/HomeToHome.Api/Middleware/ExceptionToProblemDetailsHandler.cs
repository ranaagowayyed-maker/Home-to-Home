using HomeToHome.Domain.Errors;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace HomeToHome.Api.Middleware;

public sealed partial class ExceptionToProblemDetailsHandler(
    IProblemDetailsService problemDetails,
    ILogger<ExceptionToProblemDetailsHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is not DomainException domain)
        {
            LogUnhandled(logger, exception);
            return await WriteAsync(httpContext, exception, StatusCodes.Status500InternalServerError, "internal_error",
                "Something went wrong. Try again.");
        }

        var status = domain switch
        {
            ValidationException => StatusCodes.Status422UnprocessableEntity,
            UnauthenticatedException => StatusCodes.Status401Unauthorized,
            ForbiddenException => StatusCodes.Status403Forbidden,
            NotFoundException => StatusCodes.Status404NotFound,
            ConflictException => StatusCodes.Status409Conflict,
            RateLimitedException => StatusCodes.Status429TooManyRequests,
            ServiceUnavailableException => StatusCodes.Status503ServiceUnavailable,
            _ => StatusCodes.Status400BadRequest,
        };
        return await WriteAsync(httpContext, exception, status, domain.Code, domain.Message,
            (domain as ValidationException)?.Errors);
    }

    private ValueTask<bool> WriteAsync(
        HttpContext httpContext,
        Exception exception,
        int status,
        string code,
        string detail,
        IReadOnlyDictionary<string, string[]>? errors = null)
    {
        httpContext.Response.StatusCode = status;
        var details = errors is null
            ? new ProblemDetails()
            : new ValidationProblemDetails(errors.ToDictionary(e => e.Key, e => e.Value));
        details.Status = status;
        details.Detail = detail;
        details.Extensions["code"] = code;
        if (exception is ConflictException conflict)
        {
            foreach (var (key, value) in conflict.Extensions)
            {
                details.Extensions[key] = value;
            }
        }

        return problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = details,
            Exception = exception,
        });
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Unhandled exception")]
    private static partial void LogUnhandled(ILogger logger, Exception exception);
}
