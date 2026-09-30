using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Services.Interfaces;

namespace SocialSport.Api.Controllers;

[ApiController, Route("api/v1/media")]
public class MediaController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IMediaUrlService _mediaUrls;
    public MediaController(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        IMediaUrlService mediaUrls)
    {
        _context = context;
        _environment = environment;
        _mediaUrls = mediaUrls;
    }

    [AllowAnonymous, HttpGet("posts/{mediaId:guid}")]
    public async Task<IActionResult> PostMedia(Guid mediaId, [FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token) || !_mediaUrls.ValidatePostMediaToken(mediaId, token)) return NotFound();
        var media = await _context.PostMedia
            .AsNoTracking()
            .Include(x => x.Post)
            .ThenInclude(x => x.Group)
            .FirstOrDefaultAsync(x => x.Id == mediaId);

        var groupUnavailable = media?.Post?.Group is not null &&
            (media.Post.Group.Status != GroupStatus.Active || media.Post.Group.DeletedAt != null);

        var isPendingGroupReview = media?.Post is not null
            && media.Post.GroupModerationStatus
                == GroupPostModerationStatus.Pending;
        if (media?.Post is null ||
            (media.Post.Status != PostStatus.Published
                && !isPendingGroupReview) ||
            media.Post.DeletedAt != null ||
            groupUnavailable)
        {
            return NotFound();
        }
        const string prefix = "/uploads/posts/";
        if (!media.Url.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) return NotFound();
        var webRoot = _environment.WebRootPath ??
            Path.Combine(_environment.ContentRootPath, "wwwroot");
        var folder = Path.GetFullPath(Path.Combine(webRoot, "uploads", "posts"));
        var path = Path.GetFullPath(Path.Combine(folder, Path.GetFileName(media.Url)));
        var isInsidePostFolder = path.StartsWith(
            folder + Path.DirectorySeparatorChar,
            StringComparison.OrdinalIgnoreCase);

        if (!isInsidePostFolder || !System.IO.File.Exists(path))
        {
            return NotFound();
        }
        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(path, out var contentType)) contentType = "application/octet-stream";
        return PhysicalFile(path, contentType, enableRangeProcessing: true);
    }
}
