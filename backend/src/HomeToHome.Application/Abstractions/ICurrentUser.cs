using HomeToHome.Domain.Enums;

namespace HomeToHome.Application.Abstractions;

public interface ICurrentUser
{
    Guid UserId { get; }

    Role Role { get; }
}
