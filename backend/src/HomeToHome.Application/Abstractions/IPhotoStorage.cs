namespace HomeToHome.Application.Abstractions;

public sealed record PhotoUpload(string UploadUrl, string PhotoUrl);

public interface IPhotoStorage
{
    PhotoUpload CreateUpload(Guid motherId, string contentType);

    bool IsOwnedBy(Guid motherId, string photoUrl);
}
