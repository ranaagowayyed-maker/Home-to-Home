using FluentValidation;
using HomeToHome.Application.Common;

namespace HomeToHome.Application.Profiles;

public sealed class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(r => r.Email).Null().WithMessage("Email can't be changed.");
        RuleFor(r => r.Role).Null().WithMessage("Role can't be changed.");
        RuleFor(r => r.Name!)
            .Must(name => name.Trim().Length is >= 2 and <= 80).WithMessage("Name must be 2 to 80 characters.")
            .When(r => r.Name is not null);
        RuleFor(r => r.Phone).NotEmpty().WithMessage("Enter a valid phone number.").ValidPhone()
            .When(r => r.Phone is not null);
        RuleFor(r => r.Address!)
            .Must(address => address.Trim().Length is 0 or (>= 5 and <= 300))
            .WithMessage("Address must be 5 to 300 characters.")
            .When(r => r.Address is not null);
        RuleFor(r => r.City).MaximumLength(80);
        RuleFor(r => r.KitchenName!)
            .Must(name => name.Trim().Length is >= 3 and <= 60).WithMessage("Kitchen name must be 3 to 60 characters.")
            .When(r => r.KitchenName is not null);
        RuleFor(r => r.Bio).MaximumLength(500);
    }
}

public sealed class UpdateAvailabilityRequestValidator : AbstractValidator<UpdateAvailabilityRequest>
{
    public UpdateAvailabilityRequestValidator()
    {
        RuleFor(r => r.IsAvailable).NotNull().WithMessage("Send isAvailable as true or false.");
    }
}
