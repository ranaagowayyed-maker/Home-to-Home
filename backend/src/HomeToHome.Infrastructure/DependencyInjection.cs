using Amazon.S3;
using HomeToHome.Application.Abstractions;
using HomeToHome.Infrastructure.Auth;
using HomeToHome.Infrastructure.Caching;
using HomeToHome.Infrastructure.Persistence;
using HomeToHome.Infrastructure.Storage;
using HomeToHome.Infrastructure.Time;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace HomeToHome.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>((sp, options) =>
        {
            var connectionString = sp.GetRequiredService<IConfiguration>().GetConnectionString("Postgres");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException("ConnectionStrings:Postgres is not configured.");
            }

            options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention();
        });
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddSingleton<IClock, SystemClock>();

        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(o => o.SigningKey.Length >= 32, "Jwt:SigningKey must be at least 32 characters.")
            .ValidateOnStart();
        services.AddSingleton<ITokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHashingService, PasswordHashingService>();

        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.AddSingleton(sp => new Lazy<IAmazonS3>(() => CreateS3Client(sp.GetRequiredService<IOptions<StorageOptions>>().Value)));
        services.AddSingleton<IPhotoStorage, S3PhotoStorage>();

        var redisConnection = configuration.GetConnectionString("Redis");
        if (string.IsNullOrWhiteSpace(redisConnection))
        {
            services.AddSingleton<IRateLimiter, InMemoryRateLimiter>();
        }
        else
        {
            services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConnection));
            services.AddSingleton<IRateLimiter, RedisRateLimiter>();
        }

        return services;
    }

    private static AmazonS3Client CreateS3Client(StorageOptions options)
    {
        var config = new AmazonS3Config { ForcePathStyle = true };
        if (string.IsNullOrWhiteSpace(options.ServiceUrl))
        {
            config.RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(options.Region);
        }
        else
        {
            config.ServiceURL = options.ServiceUrl;
            config.AuthenticationRegion = options.Region;
        }

        return new AmazonS3Client(options.AccessKey, options.SecretKey, config);
    }
}
