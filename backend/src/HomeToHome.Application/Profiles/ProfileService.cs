using FluentValidation;
using HomeToHome.Application.Abstractions;
using HomeToHome.Application.Auth;
using HomeToHome.Application.Common;
using HomeToHome.Domain.Entities;
using HomeToHome.Domain.Enums;
using HomeToHome.Domain.Errors;
using Microsoft.EntityFrameworkCore;

namespace HomeToHome.Application.Profiles;

public sealed class ProfileService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IValidator<UpdateProfileRequest> profileValidator,
    IValidator<UpdateAvailabilityRequest> availabilityValidator)
{
    public async Task<UserDto> GetAsync(CancellationToken cancellationToken) =>
        UserDto.From(await LoadAsync(tracking: false, cancellationToken));

    public async Task<UserDto> UpdateAsync(UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        await profileValidator.EnsureValidAsync(request, cancellationToken);

        var user = await LoadAsync(tracking: true, cancellationToken);
        if (user.MotherProfile is null && (request.KitchenName is not null || request.Bio is not null))
        {
            throw new Domain.Errors.ValidationException(new Dictionary<string, string[]>
            {
                [request.KitchenName is not null ? "kitchenName" : "bio"] = ["Only mothers have a kitchen profile."],
            });
        }

        user.Name = request.Name?.Trim() ?? user.Name;
        user.Phone = request.Phone?.Trim() ?? user.Phone;
        user.Address = request.Address is null ? user.Address : NullIfEmpty(request.Address);
        user.City = request.City is null ? user.City : NullIfEmpty(request.City);
        if (user.MotherProfile is not null)
        {
            user.MotherProfile.KitchenName = request.KitchenName?.Trim() ?? user.MotherProfile.KitchenName;
            user.MotherProfile.Bio = request.Bio is null ? user.MotherProfile.Bio : NullIfEmpty(request.Bio);
        }

        await db.SaveChangesAsync(cancellationToken);
        return UserDto.From(user);
    }

    /// <summary>Pausing hides the mother's meals and refuses new orders; orders already placed are unaffected.</summary>
    public async Task<AvailabilityDto> SetAvailabilityAsync(
        UpdateAvailabilityRequest request,
        CancellationToken cancellationToken)
    {
        await availabilityValidator.EnsureValidAsync(request, cancellationToken);

        var profile = await db.MotherProfiles.SingleOrDefaultAsync(p => p.UserId == currentUser.UserId, cancellationToken)
            ?? throw new ForbiddenException("Only mothers can pause orders.");
        profile.IsAvailable = request.IsAvailable!.Value;
        await db.SaveChangesAsync(cancellationToken);
        return new AvailabilityDto(profile.IsAvailable);
    }

    private async Task<User> LoadAsync(bool tracking, CancellationToken cancellationToken)
    {
        var query = db.Users.Include(u => u.MotherProfile).Where(u => u.Id == currentUser.UserId);
        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        var user = await query.SingleOrDefaultAsync(cancellationToken) ?? throw new NotFoundException("User not found.");
        if (user.Role == Role.Mother && user.MotherProfile is null)
        {
            throw new NotFoundException("Kitchen profile not found.");
        }

        return user;
    }

    private static string? NullIfEmpty(string value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
