using HomeToHome.Application.Auth;
using HomeToHome.Application.Meals;
using HomeToHome.Domain.Enums;

namespace HomeToHome.UnitTests;

public sealed class ValidatorTests
{
    private static RegisterRequest Register(Role role = Role.Customer, string password = "Passw0rd", string? kitchen = null) =>
        new("Sara", "sara@example.test", "+20 123 456 7890", password, role, kitchen);

    [Fact]
    public void Valid_customer_registration_passes()
    {
        Assert.True(new RegisterRequestValidator().Validate(Register()).IsValid);
    }

    [Theory]
    [InlineData("short1")]
    [InlineData("onlyletters")]
    [InlineData("12345678")]
    public void Weak_passwords_fail(string password)
    {
        var result = new RegisterRequestValidator().Validate(Register(password: password));

        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Password));
    }

    [Fact]
    public void Kitchen_name_is_required_only_for_mothers()
    {
        var validator = new RegisterRequestValidator();

        Assert.False(validator.Validate(Register(Role.Mother)).IsValid);
        Assert.True(validator.Validate(Register(Role.Mother, kitchen: "Fatima's Kitchen")).IsValid);
        Assert.True(validator.Validate(Register(Role.Delivery)).IsValid);
    }

    [Theory]
    [InlineData("Ab", 100, false)]
    [InlineData("Abc", 100, true)]
    [InlineData("Stuffed Grape Leaves", 0, false)]
    public void Meal_name_and_price_rules(string name, int priceMinor, bool valid)
    {
        var request = new CreateMealRequest(name, null, MealCategory.MainDish, priceMinor, null);

        Assert.Equal(valid, new CreateMealRequestValidator().Validate(request).IsValid);
    }

    [Fact]
    public void Meal_name_longer_than_80_characters_fails()
    {
        var request = new CreateMealRequest(new string('a', 81), null, MealCategory.Dessert, 100, null);

        Assert.False(new CreateMealRequestValidator().Validate(request).IsValid);
    }

    [Fact]
    public void Partial_update_validates_only_supplied_fields()
    {
        var validator = new UpdateMealRequestValidator();

        Assert.True(validator.Validate(new UpdateMealRequest(null, null, null, null, null, false, null)).IsValid);
        Assert.False(validator.Validate(new UpdateMealRequest(null, null, null, 0, null, null, null)).IsValid);
    }

    [Theory]
    [InlineData("image/jpeg", 5 * 1024 * 1024, true)]
    [InlineData("image/png", 1, true)]
    [InlineData("image/webp", 1, false)]
    [InlineData("image/png", 5 * 1024 * 1024 + 1, false)]
    public void Photo_upload_type_and_size(string contentType, long size, bool valid)
    {
        Assert.Equal(valid, new PhotoUploadRequestValidator().Validate(new PhotoUploadRequest(contentType, size)).IsValid);
    }
}
