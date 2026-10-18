using Amazon.S3;
using Amazon.S3.Model;
using HomeToHome.Application.Abstractions;
using HomeToHome.Domain.Errors;
using Microsoft.Extensions.Options;

namespace HomeToHome.Infrastructure.Storage;

public sealed class S3PhotoStorage(IOptions<StorageOptions> options, IClock clock, Lazy<IAmazonS3> s3) : IPhotoStorage
{
    private readonly StorageOptions _options = options.Value;

    public PhotoUpload CreateUpload(Guid motherId, string contentType)
    {
        if (!_options.IsConfigured)
        {
            throw new ServiceUnavailableException("storage_unavailable", "Photo uploads are not available right now.");
        }

        var key = $"{KeyPrefix(motherId)}{Guid.NewGuid():N}{Extension(contentType)}";
        var uploadUrl = s3.Value.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = _options.Bucket,
            Key = key,
            Verb = HttpVerb.PUT,
            ContentType = contentType,
            Expires = clock.UtcNow.AddMinutes(_options.UploadUrlMinutes).UtcDateTime,
            Protocol = _options.ServiceUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                ? Protocol.HTTP
                : Protocol.HTTPS,
        });
        return new PhotoUpload(uploadUrl, $"{_options.PublicBaseUrl.TrimEnd('/')}/{key}");
    }

    public bool IsOwnedBy(Guid motherId, string photoUrl)
    {
        if (!_options.IsConfigured)
        {
            return false;
        }

        var prefix = $"{_options.PublicBaseUrl.TrimEnd('/')}/{KeyPrefix(motherId)}";
        if (!photoUrl.StartsWith(prefix, StringComparison.Ordinal))
        {
            return false;
        }

        var fileName = photoUrl[prefix.Length..];
        return fileName.Length > 0 && !fileName.Contains('/', StringComparison.Ordinal) && !fileName.Contains("..", StringComparison.Ordinal);
    }

    private static string KeyPrefix(Guid motherId) => $"meals/{motherId}/";

    private static string Extension(string contentType) => contentType == "image/png" ? ".png" : ".jpg";
}
