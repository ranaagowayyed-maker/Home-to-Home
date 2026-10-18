using HomeToHome.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HomeToHome.Infrastructure.Persistence.Configurations;

internal sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_orders_total", "total_minor = subtotal_minor + delivery_fee_minor");
            t.HasCheckConstraint("ck_orders_subtotal_non_negative", "subtotal_minor >= 0");
        });

        builder.Property(o => o.Number)
            .HasDefaultValueSql($"nextval('{Order.NumberSequence}')");
        builder.Property(o => o.DeliveryAddress).HasMaxLength(300);
        builder.Property(o => o.CustomerPhone).HasMaxLength(20);
        builder.Property(o => o.Notes).HasMaxLength(500);
        builder.Property(o => o.IdempotencyKey).HasMaxLength(64);
        builder.Property(o => o.Version).IsRowVersion();

        builder.HasIndex(o => o.Number).IsUnique();
        builder.HasIndex(o => o.IdempotencyKey).IsUnique();
        builder.HasIndex(o => new { o.CustomerId, o.CreatedAt }).IsDescending(false, true);
        builder.HasIndex(o => new { o.MotherId, o.Status });
        builder.HasIndex(o => new { o.DeliveryPersonId, o.Status });

        builder.HasOne(o => o.Customer)
            .WithMany()
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(o => o.Mother)
            .WithMany()
            .HasForeignKey(o => o.MotherId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(o => o.DeliveryPerson)
            .WithMany()
            .HasForeignKey(o => o.DeliveryPersonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("ck_order_items_quantity", "quantity BETWEEN 1 AND 10");
            t.HasCheckConstraint("ck_order_items_unit_price_positive", "unit_price_minor > 0");
        });
        builder.Property(i => i.NameSnapshot).HasMaxLength(80);

        builder.HasOne(i => i.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(i => i.Meal)
            .WithMany()
            .HasForeignKey(i => i.MealId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class OrderStatusEventConfiguration : IEntityTypeConfiguration<OrderStatusEvent>
{
    public void Configure(EntityTypeBuilder<OrderStatusEvent> builder)
    {
        builder.HasIndex(e => new { e.OrderId, e.CreatedAt });
        builder.HasOne(e => e.Order)
            .WithMany(o => o.StatusEvents)
            .HasForeignKey(e => e.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.Actor)
            .WithMany()
            .HasForeignKey(e => e.ActorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class DeliveryRequestConfiguration : IEntityTypeConfiguration<DeliveryRequest>
{
    public void Configure(EntityTypeBuilder<DeliveryRequest> builder)
    {
        builder.HasIndex(r => r.OrderId).IsUnique();
        builder.HasIndex(r => r.Status);
        builder.HasOne(r => r.Order)
            .WithOne(o => o.DeliveryRequest)
            .HasForeignKey<DeliveryRequest>(r => r.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(r => r.AcceptedBy)
            .WithMany()
            .HasForeignKey(r => r.AcceptedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.Property(n => n.Message).HasMaxLength(300);
        builder.HasIndex(n => new { n.UserId, n.ReadAt, n.CreatedAt }).IsDescending(false, false, true);
        builder.HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(n => n.Order)
            .WithMany()
            .HasForeignKey(n => n.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
