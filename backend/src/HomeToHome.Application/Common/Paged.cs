namespace HomeToHome.Application.Common;

public sealed record Paged<T>(IReadOnlyList<T> Items, int Page, int PageSize, int Total);

public sealed record PageRequest(int Page = 1, int PageSize = PageRequest.DefaultPageSize)
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 50;

    public int SafePage => Math.Max(1, Page);

    public int SafePageSize => Math.Clamp(PageSize, 1, MaxPageSize);
}
