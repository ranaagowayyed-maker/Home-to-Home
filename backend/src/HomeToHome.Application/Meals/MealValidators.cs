using FluentValidation;

namespace HomeToHome.Application.Meals;

public sealed class PhotoUploadRequestValidator : AbstractValidator<PhotoUploadRequest>
{
    public const long MaxPhotoBytes = 5 * 1024 * 1024;
    public static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png"];

    public PhotoUploadRequestValidator()
    {
        RuleFor(r => r.ContentType)
            .Must(AllowedContentTypes.Contains)
            .WithMessage("Photo must be a JPEG or PNG image.");
        RuleFor(r => r.Size)
            .GreaterThan(0)
            .LessThanOrEqualTo(MaxPhotoBytes)
            .WithMessage("Photo must be 5 MB or smaller.");
    }
}

public sealed class CreateMealRequestValidator : AbstractValidator<CreateMealRequest>
{
    public CreateMealRequestValidator()
    {
        RuleFor(r => r.Name).NotEmpty().Must(MealRules.HasValidNameLength).WithMessage(MealRules.NameMessage);
        RuleFor(r => r.Description).MaximumLength(MealRules.MaxDescriptionLength);
        RuleFor(r => r.Category).IsInEnum();
        RuleFor(r => r.PriceMinor).GreaterThan(0).WithMessage(MealRules.PriceMessage);
    }
}

public sealed class UpdateMealRequestValidator : AbstractValidator<UpdateMealRequest>
{
    public UpdateMealRequestValidator()
    {
        RuleFor(r => r.Name!).Must(MealRules.HasValidNameLength).WithMessage(MealRules.NameMessage)
            .When(r => r.Name is not null);
        RuleFor(r => r.Description).MaximumLength(MealRules.MaxDescriptionLength);
        RuleFor(r => r.Category).IsInEnum();
        RuleFor(r => r.PriceMinor).GreaterThan(0).WithMessage(MealRules.PriceMessage)
            .When(r => r.PriceMinor is not null);
    }
}

internal static class MealRules
{
    public const int MaxDescriptionLength = 500;
    public const string NameMessage = "Name must be 3 to 80 characters.";
    public const string PriceMessage = "Price must be greater than 0.";

    public static bool HasValidNameLength(string name) => name.Trim().Length is >= 3 and <= 80;
}
