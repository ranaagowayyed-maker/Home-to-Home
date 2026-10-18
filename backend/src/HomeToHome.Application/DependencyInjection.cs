using FluentValidation;
using HomeToHome.Application.Auth;
using HomeToHome.Application.Deliveries;
using HomeToHome.Application.Meals;
using HomeToHome.Application.Orders;
using Microsoft.Extensions.DependencyInjection;

namespace HomeToHome.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<AuthService>(includeInternalTypes: false);
        services.AddScoped<AuthService>();
        services.AddScoped<MealService>();
        services.AddScoped<OrderService>();
        services.AddScoped<DeliveryService>();
        return services;
    }
}
