using FluentValidation;
using HomeToHome.Domain.Errors;

namespace HomeToHome.Application.Common;

public static class ValidatorExtensions
{
    public static async Task EnsureValidAsync<T>(
        this IValidator<T> validator,
        T instance,
        CancellationToken cancellationToken)
    {
        var result = await validator.ValidateAsync(instance, cancellationToken);
        if (result.IsValid)
        {
            return;
        }

        var errors = result.Errors
            .GroupBy(e => ToCamelCase(e.PropertyName))
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).Distinct().ToArray());
        throw new Domain.Errors.ValidationException(errors);
    }

    public static IRuleBuilderOptions<T, string?> ValidPhone<T>(this IRuleBuilder<T, string?> rule) =>
        rule.Matches(@"^\+?[0-9 ]{7,20}$").WithMessage("Enter a valid phone number.");

    private static string ToCamelCase(string name) =>
        string.IsNullOrEmpty(name) ? name : char.ToLowerInvariant(name[0]) + name[1..];
}
