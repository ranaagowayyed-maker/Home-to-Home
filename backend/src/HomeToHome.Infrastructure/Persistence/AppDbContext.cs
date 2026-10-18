using HomeToHome.Application.Abstractions;
using HomeToHome.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HomeToHome.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public const string OrderNumberSequence = "order_numbers";

    public DbSet<User> Users => Set<User>();
    public DbSet<MotherProfile> MotherProfiles => Set<MotherProfile>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Meal> Meals => Set<Meal>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderStatusEvent> OrderStatusEvents => Set<OrderStatusEvent>();
    public DbSet<DeliveryRequest> DeliveryRequests => Set<DeliveryRequest>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("pg_trgm");
        modelBuilder.HasSequence<int>(OrderNumberSequence).StartsAt(1000);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // Enums are stored as readable text (for example "ReadyForPickup") rather than integers.
        configurationBuilder.Properties<Enum>().HaveConversion<string>().HaveMaxLength(32);
    }
}
