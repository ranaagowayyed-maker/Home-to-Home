using FluentValidation;
using HomeToHome.Application.Common;

namespace HomeToHome.Application.Orders;

public sealed class PlaceOrderRequestValidator : AbstractValidator<PlaceOrderRequest>
{
    public const int MaxLines = 20;

    public PlaceOrderRequestValidator()
    {
        RuleFor(r => r.Items)
            .NotEmpty().WithMessage("Add at least one meal.")
            .Must(items => items!.Count <= MaxLines).WithMessage($"An order can hold at most {MaxLines} meals.")
            .Must(items => items!.Select(i => i.MealId).Distinct().Count() == items!.Count)
            .WithMessage("Each meal can appear only once.");
        RuleForEach(r => r.Items).ChildRules(item =>
            item.RuleFor(i => i.Quantity).InclusiveBetween(1, 10).WithMessage("Quantity must be between 1 and 10."));
        RuleFor(r => r.DeliveryAddress).NotEmpty().Length(5, 300);
        RuleFor(r => r.CustomerPhone).NotEmpty().ValidPhone();
        RuleFor(r => r.Notes).MaximumLength(500);
    }
}
