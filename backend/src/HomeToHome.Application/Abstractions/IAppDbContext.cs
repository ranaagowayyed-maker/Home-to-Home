using HomeToHome.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HomeToHome.Application.Abstractions;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<MotherProfile> MotherProfiles { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Meal> Meals { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<OrderStatusEvent> OrderStatusEvents { get; }
    DbSet<DeliveryRequest> DeliveryRequests { get; }
    DbSet<Notification> Notifications { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
