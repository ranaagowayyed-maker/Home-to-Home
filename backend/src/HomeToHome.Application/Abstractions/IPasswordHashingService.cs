using HomeToHome.Domain.Entities;

namespace HomeToHome.Application.Abstractions;

public interface IPasswordHashingService
{
    string Hash(User user, string password);

    bool Verify(User user, string password);
}
