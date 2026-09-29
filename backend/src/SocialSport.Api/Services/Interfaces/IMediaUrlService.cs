namespace SocialSport.Api.Services.Interfaces;

public interface IMediaUrlService
{
    string CreatePostMediaUrl(Guid mediaId);
    bool ValidatePostMediaToken(Guid mediaId, string token);
}
