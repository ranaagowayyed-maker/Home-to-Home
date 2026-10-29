using HomeToHome.Infrastructure.Auth;
using Microsoft.AspNetCore.Authorization;

namespace HomeToHome.Api.Authorization;

public static class Policies
{
    public const string CustomerOnly = nameof(CustomerOnly);
    public const string MotherOnly = nameof(MotherOnly);
    public const string DeliveryOnly = nameof(DeliveryOnly);

    public static AuthorizationBuilder AddRolePolicies(this AuthorizationBuilder builder) => builder
        .AddPolicy(CustomerOnly, p => p.RequireRole(RoleNames.Customer))
        .AddPolicy(MotherOnly, p => p.RequireRole(RoleNames.Mother))
        .AddPolicy(DeliveryOnly, p => p.RequireRole(RoleNames.Delivery));
}
