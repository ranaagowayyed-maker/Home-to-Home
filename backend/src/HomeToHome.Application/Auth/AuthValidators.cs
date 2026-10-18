using FluentValidation;
using HomeToHome.Application.Common;
using HomeToHome.Domain.Enums;

namespace HomeToHome.Application.Auth;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(r => r.Name).NotEmpty().Length(2, 80);
        RuleFor(r => r.Email).NotEmpty().EmailAddress().MaximumLength(254);
        RuleFor(r => r.Phone).NotEmpty().ValidPhone();
        RuleFor(r => r.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Za-z]").WithMessage("Password must contain a letter.")
            .Matches("[0-9]").WithMessage("Password must contain a number.");
        RuleFor(r => r.Role).IsInEnum();
        RuleFor(r => r.KitchenName)
            .NotEmpty().Length(3, 60)
            .When(r => r.Role == Role.Mother);
    }
}

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(r => r.Email).NotEmpty();
        RuleFor(r => r.Password).NotEmpty();
    }
}
