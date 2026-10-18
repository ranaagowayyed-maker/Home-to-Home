namespace HomeToHome.Infrastructure.Storage;

public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>S3 API endpoint, for example http://localhost:9000 for MinIO or an R2 endpoint.</summary>
    public string ServiceUrl { get; set; } = string.Empty;
    public string Region { get; set; } = "us-east-1";
    public string Bucket { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;

    /// <summary>Public base URL photos are served from, without a trailing slash.</summary>
    public string PublicBaseUrl { get; set; } = string.Empty;

    public int UploadUrlMinutes { get; set; } = 5;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Bucket)
        && !string.IsNullOrWhiteSpace(AccessKey)
        && !string.IsNullOrWhiteSpace(SecretKey)
        && !string.IsNullOrWhiteSpace(PublicBaseUrl);
}
