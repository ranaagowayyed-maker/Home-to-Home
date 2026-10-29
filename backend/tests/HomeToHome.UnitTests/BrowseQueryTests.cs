using HomeToHome.Application.Meals;
using HomeToHome.Application.Profiles;
using HomeToHome.Domain.Enums;
using HomeToHome.Domain.Errors;

namespace HomeToHome.UnitTests;

public sealed class BrowseQueryTests
{
    [Fact]
    public void Empty_values_mean_no_filters_newest_first()
    {
        Assert.Equal(BrowseQuery.All, BrowseQuery.Parse("  ", "", null, null));
    }

    [Theory]
    [InlineData("MAIN_DISH", MealCategory.MainDish)]
    [InlineData("dessert", MealCategory.Dessert)]
    public void Category_accepts_api_spelling(string value, MealCategory expected)
    {
        Assert.Equal(expected, BrowseQuery.Parse(null, value, null, null).Category);
    }

    [Theory]
    [InlineData("newest", BrowseSort.Newest)]
    [InlineData("price_asc", BrowseSort.PriceAsc)]
    [InlineData("PRICE_DESC", BrowseSort.PriceDesc)]
    public void Sort_accepts_snake_case(string value, BrowseSort expected)
    {
        Assert.Equal(expected, BrowseQuery.Parse(null, null, null, value).Sort);
    }

    [Fact]
    public void Search_is_trimmed()
    {
        Assert.Equal("grape leaves", BrowseQuery.Parse("  grape leaves ", null, null, null).Search);
    }

    [Fact]
    public void Every_invalid_value_is_reported_at_once()
    {
        var error = Assert.Throws<ValidationException>(() =>
            BrowseQuery.Parse(new string('a', 81), "SOUP", -1, "cheapest"));

        Assert.Equal(["category", "maxPriceMinor", "q", "sort"], error.Errors.Keys.Order());
    }
}

public sealed class ProfileValidatorTests
{
    private static UpdateProfileRequest Request(
        string? name = null,
        string? phone = null,
        string? address = null,
        string? kitchenName = null,
        string? email = null,
        Role? role = null) =>
        new(name, phone, address, null, kitchenName, null, email, role);

    [Fact]
    public void Empty_update_is_valid()
    {
        Assert.True(new UpdateProfileRequestValidator().Validate(Request()).IsValid);
    }

    [Fact]
    public void Email_and_role_are_read_only()
    {
        var result = new UpdateProfileRequestValidator().Validate(Request(email: "x@example.test", role: Role.Mother));

        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateProfileRequest.Email));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateProfileRequest.Role));
    }

    [Theory]
    [InlineData(" ", null, null, null)]
    [InlineData(null, "abc", null, null)]
    [InlineData(null, "", null, null)]
    [InlineData(null, null, "abc", null)]
    [InlineData(null, null, null, "Ab")]
    public void Invalid_fields_fail(string? name, string? phone, string? address, string? kitchenName)
    {
        Assert.False(new UpdateProfileRequestValidator().Validate(Request(name, phone, address, kitchenName)).IsValid);
    }

    [Fact]
    public void Empty_address_clears_it()
    {
        Assert.True(new UpdateProfileRequestValidator().Validate(Request(address: "")).IsValid);
    }
}
