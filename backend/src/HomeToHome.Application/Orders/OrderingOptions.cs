namespace HomeToHome.Application.Orders;

public sealed class OrderingOptions
{
    public const string SectionName = "Ordering";

    /// <summary>Flat delivery fee added to every order, in minor units.</summary>
    public int DeliveryFeeMinor { get; set; } = 1500;

    /// <summary>ISO 4217 code all prices are expressed in.</summary>
    public string Currency { get; set; } = "USD";

    public int MaxActiveDeliveries { get; set; } = 3;
}
