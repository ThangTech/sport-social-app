using Microsoft.AspNetCore.DataProtection;
using SocialSport.Api.Services.Interfaces;
using System.Security.Cryptography;

namespace SocialSport.Api.Services.Implementations;

public class MediaUrlService : IMediaUrlService
{
    private readonly ITimeLimitedDataProtector _protector;
    public MediaUrlService(IDataProtectionProvider provider)
    {
        _protector = provider
            .CreateProtector("SocialSport.PostMedia.v2")
            .ToTimeLimitedDataProtector();
    }

    public string CreatePostMediaUrl(Guid mediaId)
    {
        var token = _protector.Protect(
            mediaId.ToString("D"),
            TimeSpan.FromMinutes(15));
        return $"/api/v1/media/posts/{mediaId:D}?token={Uri.EscapeDataString(token)}";
    }

    public bool ValidatePostMediaToken(Guid mediaId, string token)
    {
        try
        {
            return Guid.TryParse(_protector.Unprotect(token), out var protectedId)
                && protectedId == mediaId;
        }
        catch (Exception ex) when (ex is CryptographicException or FormatException)
        {
            return false;
        }
    }
}
