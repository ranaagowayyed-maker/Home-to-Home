using HomeToHome.Domain.Enums;

namespace HomeToHome.Application.Meals;

public enum BrowseSort
{
    Newest,
    PriceAsc,
    PriceDesc,
}

/// <summary>Search and filters for customer browsing (P1-F001); every part is optional and they combine with AND.</summary>
public sealed record BrowseQuery(string? Search, MealCategory? Category, int? MaxPriceMinor, BrowseSort Sort)
{
    public const int MaxSearchLength = 80;

    public static readonly BrowseQuery All = new(null, null, null, BrowseSort.Newest);

    /// <summary>Parses query-string values such as <c>category=MAIN_DISH</c> and <c>sort=price_asc</c>.</summary>
    public static BrowseQuery Parse(string? search, string? category, int? maxPriceMinor, string? sort)
    {
        var errors = new Dictionary<string, string[]>();
        var term = string.IsNullOrWhiteSpace(search) ? null : search.Trim();
        if (term is { Length: > MaxSearchLength })
        {
            errors["q"] = [$"Search must be at most {MaxSearchLength} characters."];
        }

        MealCategory? parsedCategory = null;
        if (!string.IsNullOrWhiteSpace(category))
        {
            if (TryParseSnakeCase<MealCategory>(category, out var value))
            {
                parsedCategory = value;
            }
            else
            {
                errors["category"] = [$"Unknown category '{category}'."];
            }
        }

        if (maxPriceMinor is <= 0)
        {
            errors["maxPriceMinor"] = ["Maximum price must be a positive number."];
        }

        var parsedSort = BrowseSort.Newest;
        if (!string.IsNullOrWhiteSpace(sort) && !TryParseSnakeCase(sort, out parsedSort))
        {
            errors["sort"] = ["Sort must be newest, price_asc or price_desc."];
        }

        return errors.Count > 0
            ? throw new Domain.Errors.ValidationException(errors)
            : new BrowseQuery(term, parsedCategory, maxPriceMinor, parsedSort);
    }

    private static bool TryParseSnakeCase<TEnum>(string value, out TEnum result)
        where TEnum : struct, Enum =>
        Enum.TryParse(value.Trim().Replace("_", string.Empty, StringComparison.Ordinal), ignoreCase: true, out result)
        && Enum.IsDefined(result);
}
