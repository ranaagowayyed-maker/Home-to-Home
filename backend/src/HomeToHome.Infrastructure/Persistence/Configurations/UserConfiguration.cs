using HomeToHome.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HomeToHome.Infrastructure.Persistence.Configurations;

internal sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.Property(u => u.Name).HasMaxLength(80);
        builder.Property(u => u.Email).HasMaxLength(254);
        builder.Property(u => u.Phone).HasMaxLength(20);
        builder.Property(u => u.Address).HasMaxLength(300);
        builder.Property(u => u.City).HasMaxLength(80);
        builder.HasIndex(u => u.Email).IsUnique();

        builder.HasOne(u => u.MotherProfile)
            .WithOne(p => p.User)
            .HasForeignKey<MotherProfile>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class MotherProfileConfiguration : IEntityTypeConfiguration<MotherProfile>
{
    public void Configure(EntityTypeBuilder<MotherProfile> builder)
    {
        builder.HasKey(p => p.UserId);
        builder.Property(p => p.KitchenName).HasMaxLength(60);
        builder.Property(p => p.Bio).HasMaxLength(500);
        builder.Property(p => p.IsAvailable).HasDefaultValue(true);
    }
}

internal sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.Property(t => t.TokenHash).HasMaxLength(64);
        builder.HasIndex(t => t.TokenHash).IsUnique();
        builder.HasOne(t => t.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
