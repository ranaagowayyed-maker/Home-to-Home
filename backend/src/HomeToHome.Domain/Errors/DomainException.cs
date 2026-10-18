namespace HomeToHome.Domain.Errors;

public abstract class DomainException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

public sealed class NotFoundException(string message) : DomainException("not_found", message);

public sealed class ForbiddenException(string message) : DomainException("forbidden", message);

public sealed class ConflictException(string code, string message, IReadOnlyDictionary<string, object?>? extensions = null)
    : DomainException(code, message)
{
    /// <summary>Extra machine-readable fields returned with the error, for example the unavailable meal IDs.</summary>
    public IReadOnlyDictionary<string, object?> Extensions { get; } = extensions ?? new Dictionary<string, object?>();
}

public sealed class UnauthenticatedException(string code, string message) : DomainException(code, message);

public sealed class RateLimitedException(string message) : DomainException("rate_limited", message);

public sealed class ServiceUnavailableException(string code, string message) : DomainException(code, message);

public sealed class ValidationException(IReadOnlyDictionary<string, string[]> errors)
    : DomainException("validation_failed", "One or more fields are invalid.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;
}
