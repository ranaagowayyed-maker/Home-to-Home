using HomeToHome.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HomeToHome.Infrastructure.Persistence.Configurations;

internal sealed class MealConfiguration : IEntityTypeConfiguration<Meal>
{
    public void Configure(EntityTypeBuilder<Meal> builder)
    {
        builder.ToTable(t => t.HasCheckConstraint("ck_meals_price_minor_positive", "price_minor > 0"));
        builder.Property(m => m.Name).HasMaxLength(80);
        builder.Property(m => m.Description).HasMaxLength(500);
        builder.Property(m => m.PhotoUrl).HasMaxLength(500);
        builder.Property(m => m.IsVisible).HasDefaultValue(true);

        builder.HasIndex(m => new { m.IsVisible, m.IsArchived, m.Category, m.PriceMinor });
        builder.HasIndex(m => m.MotherId);
        builder.HasIndex(m => m.Name).HasMethod("gin").HasOperators("gin_trgm_ops");

        builder.HasOne(m => m.Mother)
            .WithMany(p => p.Meals)
            .HasForeignKey(m => m.MotherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
