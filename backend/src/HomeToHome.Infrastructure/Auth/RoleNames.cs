using HomeToHome.Domain.Enums;

namespace HomeToHome.Infrastructure.Auth;

public static class RoleNames
{
    public const string Customer = "CUSTOMER";
    public const string Mother = "MOTHER";
    public const string Delivery = "DELIVERY";

    public static string ToClaim(Role role) => role switch
    {
        Role.Customer => Customer,
        Role.Mother => Mother,
        Role.Delivery => Delivery,
        _ => throw new ArgumentOutOfRangeException(nameof(role), role, null),
    };

    public static Role? FromClaim(string? value) => value switch
    {
        Customer => Role.Customer,
        Mother => Role.Mother,
        Delivery => Role.Delivery,
        _ => null,
    };
}
