using FluentValidation;
using HomeToHome.Application.Abstractions;
using HomeToHome.Application.Common;
using HomeToHome.Domain.Entities;
using HomeToHome.Domain.Errors;
using Microsoft.EntityFrameworkCore;

namespace HomeToHome.Application.Meals;

public sealed class MealService(
    IAppDbContext db,
    ICurrentUser currentUser,
    IPhotoStorage photos,
    IClock clock,
    IValidator<PhotoUploadRequest> uploadValidator,
    IValidator<CreateMealRequest> createValidator,
    IValidator<UpdateMealRequest> updateValidator)
{
    public async Task<PhotoUpload> CreatePhotoUploadAsync(PhotoUploadRequest request, CancellationToken cancellationToken)
    {
        await uploadValidator.EnsureValidAsync(request, cancellationToken);
        return photos.CreateUpload(currentUser.UserId, request.ContentType);
    }

    public async Task<MealDto> CreateAsync(CreateMealRequest request, CancellationToken cancellationToken)
    {
        await createValidator.EnsureValidAsync(request, cancellationToken);
        EnsureOwnPhoto(request.PhotoUrl);

        var meal = new Meal
        {
            Id = Guid.NewGuid(),
            MotherId = currentUser.UserId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Category = request.Category,
            PriceMinor = request.PriceMinor,
            PhotoUrl = request.PhotoUrl,
            CreatedAt = clock.UtcNow,
        };
        db.Meals.Add(meal);
        await db.SaveChangesAsync(cancellationToken);
        return MealDto.From(meal);
    }

    public async Task<Paged<MealDto>> ListMineAsync(
        PageRequest page,
        bool includeArchived,
        CancellationToken cancellationToken)
    {
        var query = db.Meals.AsNoTracking().Where(m => m.MotherId == currentUser.UserId);
        if (!includeArchived)
        {
            query = query.Where(m => !m.IsArchived);
        }

        var total = await query.CountAsync(cancellationToken);
        var meals = await query
            .OrderByDescending(m => m.CreatedAt)
            .ThenBy(m => m.Id)
            .Skip((page.SafePage - 1) * page.SafePageSize)
            .Take(page.SafePageSize)
            .ToListAsync(cancellationToken);
        return new Paged<MealDto>(meals.Select(MealDto.From).ToList(), page.SafePage, page.SafePageSize, total);
    }

    public async Task<Paged<BrowseMealDto>> BrowseAsync(PageRequest page, CancellationToken cancellationToken)
    {
        var query = BrowsableMeals();
        var total = await query.CountAsync(cancellationToken);
        var meals = await query
            .OrderByDescending(m => m.CreatedAt)
            .ThenBy(m => m.Id)
            .Skip((page.SafePage - 1) * page.SafePageSize)
            .Take(page.SafePageSize)
            .Select(ToBrowseDto)
            .ToListAsync(cancellationToken);
        return new Paged<BrowseMealDto>(meals, page.SafePage, page.SafePageSize, total);
    }

    public async Task<BrowseMealDto> GetBrowsableAsync(Guid id, CancellationToken cancellationToken) =>
        await BrowsableMeals().Where(m => m.Id == id).Select(ToBrowseDto).SingleOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException("Meal not found.");

    public async Task<MealDto> UpdateAsync(Guid id, UpdateMealRequest request, CancellationToken cancellationToken)
    {
        await updateValidator.EnsureValidAsync(request, cancellationToken);

        var meal = await db.Meals.SingleOrDefaultAsync(m => m.Id == id, cancellationToken)
            ?? throw new NotFoundException("Meal not found.");
        if (meal.MotherId != currentUser.UserId)
        {
            throw new ForbiddenException("You can only edit your own meals.");
        }

        if (request.PhotoUrl is not null && request.PhotoUrl != meal.PhotoUrl)
        {
            EnsureOwnPhoto(request.PhotoUrl);
            meal.PhotoUrl = request.PhotoUrl;
        }

        meal.Name = request.Name?.Trim() ?? meal.Name;
        meal.Description = request.Description?.Trim() ?? meal.Description;
        meal.Category = request.Category ?? meal.Category;
        meal.PriceMinor = request.PriceMinor ?? meal.PriceMinor;
        meal.IsVisible = request.IsVisible ?? meal.IsVisible;
        meal.IsArchived = request.IsArchived ?? meal.IsArchived;

        await db.SaveChangesAsync(cancellationToken);
        return MealDto.From(meal);
    }

    private static readonly System.Linq.Expressions.Expression<Func<Meal, BrowseMealDto>> ToBrowseDto = m =>
        new BrowseMealDto(m.Id, m.Name, m.Description, m.Category, m.PriceMinor, m.PhotoUrl, m.MotherId, m.Mother!.KitchenName);

    private IQueryable<Meal> BrowsableMeals() =>
        db.Meals.AsNoTracking().Where(m => m.IsVisible && !m.IsArchived && m.Mother!.IsAvailable);

    private void EnsureOwnPhoto(string? photoUrl)
    {
        if (photoUrl is not null && !photos.IsOwnedBy(currentUser.UserId, photoUrl))
        {
            throw new Domain.Errors.ValidationException(new Dictionary<string, string[]>
            {
                ["photoUrl"] = ["Upload the photo again."],
            });
        }
    }
}
