using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.DTOs.Admin;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Models.Entities;
using System.Security.Claims;
using Microsoft.AspNetCore.StaticFiles;

namespace SocialSport.Api.Controllers;

[ApiController, Authorize(Roles = "ADMIN"), Route("api/v1/admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public AdminController(
        ApplicationDbContext context,
        IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    [HttpGet("users")]
    public async Task<IActionResult> Users([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        (page, pageSize) = Normalize(page, pageSize);
        var query = _context.Users.AsNoTracking().OrderByDescending(x => x.CreatedAt);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.UserName,
                x.Email,
                x.DisplayName,
                x.Status,
                x.CreatedAt
            })
            .ToListAsync();
        return Ok(new
        {
            items,
            total = await query.CountAsync(),
            page,
            pageSize
        });
    }

    [HttpPatch("users/{id:guid}/status")]
    public async Task<IActionResult> UserStatus(Guid id, UpdateAdminStatusRequest request)
    {
        if (!Enum.IsDefined(typeof(UserStatus), request.Status))
        {
            throw new InvalidOperationException("Trạng thái người dùng không hợp lệ.");
        }
        var user = await _context.Users.FindAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");
        if (id == CurrentUserId())
        {
            throw new InvalidOperationException("System Admin không thể tự thay đổi trạng thái của mình.");
        }
        user.Status = (UserStatus)request.Status;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        AddAudit("user.status", "user", id, $"Set user status to {user.Status}.");
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("groups")]
    public async Task<IActionResult> Groups([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        (page, pageSize) = Normalize(page, pageSize);
        var query = _context.Groups.AsNoTracking().OrderByDescending(x => x.CreatedAt);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.OwnerId,
                x.Privacy,
                x.Status,
                x.CreatedAt
            })
            .ToListAsync();
        return Ok(new
        {
            items,
            total = await query.CountAsync(),
            page,
            pageSize
        });
    }

    [HttpPatch("groups/{id:guid}/status")]
    public async Task<IActionResult> GroupStatus(Guid id, UpdateAdminStatusRequest request)
    {
        if (!Enum.IsDefined(typeof(GroupStatus), request.Status))
        {
            throw new InvalidOperationException("Trạng thái nhóm không hợp lệ.");
        }
        var group = await _context.Groups.FindAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy nhóm.");
        group.Status = (GroupStatus)request.Status;
        group.UpdatedAt = DateTimeOffset.UtcNow;
        if (group.Status == Models.Enums.GroupStatus.Removed)
        {
            group.DeletedAt ??= DateTimeOffset.UtcNow;
        }
        AddAudit("group.status", "group", id, $"Set group status to {group.Status}.");
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("posts")]
    public async Task<IActionResult> Posts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        (page, pageSize) = Normalize(page, pageSize);
        var query = _context.Posts.AsNoTracking().OrderByDescending(x => x.CreatedAt);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.AuthorId,
                x.GroupId,
                x.Content,
                x.Status,
                x.CreatedAt
            })
            .ToListAsync();
        return Ok(new
        {
            items,
            total = await query.CountAsync(),
            page,
            pageSize
        });
    }

    [HttpPatch("posts/{id:guid}/status")]
    public async Task<IActionResult> PostStatus(Guid id, UpdateAdminStatusRequest request)
    {
        if (!Enum.IsDefined(typeof(PostStatus), request.Status))
        {
            throw new InvalidOperationException("Trạng thái bài viết không hợp lệ.");
        }
        var post = await _context.Posts.FindAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy bài viết.");
        post.Status = (PostStatus)request.Status;
        post.UpdatedAt = DateTimeOffset.UtcNow;
        if (post.Status == Models.Enums.PostStatus.Deleted)
        {
            post.DeletedAt ??= DateTimeOffset.UtcNow;
        }
        AddAudit("post.status", "post", id, $"Set post status to {post.Status}.");
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("comments/{id:guid}/remove")]
    public async Task<IActionResult> RemoveComment(Guid id)
    {
        var comment = await _context.Comments.FindAsync(id)
            ?? throw new KeyNotFoundException("Không tìm thấy bình luận.");
        if (comment.Status is CommentStatus.Deleted or CommentStatus.Removed)
        {
            throw new InvalidOperationException(
                "Bình luận đã được xóa hoặc gỡ trước đó.");
        }

        comment.Status = CommentStatus.Removed;
        comment.DeletedAt = DateTimeOffset.UtcNow;
        comment.UpdatedAt = DateTimeOffset.UtcNow;
        AddAudit(
            "comment.removed",
            "comment",
            id,
            $"Removed reported comment from post {comment.PostId}.");
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("reports")]
    public async Task<IActionResult> Reports([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        (page, pageSize) = Normalize(page, pageSize);
        var query = _context.Reports.AsNoTracking().OrderByDescending(x => x.CreatedAt);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.ReporterId,
                x.TargetType,
                x.TargetId,
                x.Reason,
                x.Description,
                x.Status,
                x.ReviewedBy,
                x.ReviewedAt,
                x.ResolutionNote,
                ReporterDisplayName = _context.Users
                    .Where(user => user.Id == x.ReporterId)
                    .Select(user => user.DisplayName)
                    .FirstOrDefault(),
                ReporterEmail = _context.Users
                    .Where(user => user.Id == x.ReporterId)
                    .Select(user => user.Email)
                    .FirstOrDefault(),
                ReviewedByDisplayName = x.ReviewedBy == null
                    ? null
                    : _context.Users
                        .Where(user => user.Id == x.ReviewedBy)
                        .Select(user => user.DisplayName)
                        .FirstOrDefault(),
                x.CreatedAt
            })
            .ToListAsync();
        return Ok(new
        {
            items,
            total = await query.CountAsync(),
            page,
            pageSize
        });
    }

    [HttpGet("reports/{id:guid}/target")]
    public async Task<IActionResult> ReportTarget(Guid id)
    {
        var report = await _context.Reports
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException("Không tìm thấy báo cáo.");

        return report.TargetType switch
        {
            ReportTargetType.User => Ok(await UserReportTarget(report.TargetId)),
            ReportTargetType.Post => Ok(await PostReportTarget(report.TargetId)),
            ReportTargetType.Comment => Ok(await CommentReportTarget(report.TargetId)),
            ReportTargetType.Group => Ok(await GroupReportTarget(report.TargetId)),
            _ => throw new InvalidOperationException("Loại đối tượng báo cáo không hợp lệ.")
        };
    }

    [HttpGet("post-media/{mediaId:guid}")]
    public async Task<IActionResult> PostMedia(Guid mediaId)
    {
        var mediaUrl = await _context.PostMedia
            .AsNoTracking()
            .Where(x => x.Id == mediaId)
            .Select(x => x.Url)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Không tìm thấy media bài viết.");
        const string prefix = "/uploads/posts/";
        if (!mediaUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new KeyNotFoundException("Đường dẫn media không hợp lệ.");
        }

        var webRoot = _environment.WebRootPath
            ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var root = Path.GetFullPath(Path.Combine(webRoot, "uploads", "posts"));
        var path = Path.GetFullPath(Path.Combine(root, Path.GetFileName(mediaUrl)));
        if (!path.StartsWith(
                $"{root}{Path.DirectorySeparatorChar}",
                StringComparison.OrdinalIgnoreCase)
            || !System.IO.File.Exists(path))
        {
            throw new KeyNotFoundException("File media không còn khả dụng.");
        }

        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(path, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        return PhysicalFile(path, contentType, enableRangeProcessing: true);
    }

    [HttpPatch("reports/{id:guid}/status")]
    public async Task<IActionResult> ReportStatus(
        Guid id,
        UpdateReportStatusRequest request)
    {
        if (!Enum.IsDefined(request.Status))
        {
            throw new InvalidOperationException("Trạng thái báo cáo không hợp lệ.");
        }

        var resolutionNote = CleanOptional(request.ResolutionNote);
        if (request.Status is Models.Enums.ReportStatus.Resolved
            or Models.Enums.ReportStatus.Rejected
            && resolutionNote is null)
        {
            throw new InvalidOperationException(
                "Vui lòng nhập ghi chú kết quả trước khi đóng báo cáo.");
        }

        var report = await _context.Reports.FindAsync(id)
            ?? throw new KeyNotFoundException("Không tìm thấy báo cáo.");
        report.Status = request.Status;
        report.ReviewedBy = CurrentUserId();
        report.ReviewedAt = DateTimeOffset.UtcNow;
        report.ResolutionNote = resolutionNote;
        AddAudit(
            "report.status",
            "report",
            id,
            $"Set {report.TargetType} report for {report.TargetId} to {report.Status}.");
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("sports")]
    public async Task<IActionResult> Sports()
    {
        var items = await _context.Sports
            .AsNoTracking()
            .OrderByDescending(x => x.IsActive)
            .ThenBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Slug,
                x.IconUrl,
                x.IsActive,
                PostCount = x.Posts.Count,
                x.CreatedAt,
                x.UpdatedAt
            })
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("sports")]
    public async Task<IActionResult> CreateSport(CreateAdminSportRequest request)
    {
        var name = request.Name.Trim();
        var slug = request.Slug.Trim().ToLowerInvariant();
        if (await _context.Sports.AnyAsync(x => x.Name == name || x.Slug == slug))
        {
            throw new InvalidOperationException("Tên hoặc slug môn thể thao đã tồn tại.");
        }

        var sport = new Sport
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = slug,
            IconUrl = CleanOptional(request.IconUrl),
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _context.Sports.Add(sport);
        AddAudit("sport.created", "sport", sport.Id, $"Created sport tag {sport.Name}.");
        await _context.SaveChangesAsync();
        return Ok(new
        {
            sport.Id,
            sport.Name,
            sport.Slug,
            sport.IconUrl,
            sport.IsActive,
            PostCount = 0,
            sport.CreatedAt,
            sport.UpdatedAt
        });
    }

    [HttpPatch("sports/{id:guid}")]
    public async Task<IActionResult> UpdateSport(
        Guid id,
        UpdateAdminSportRequest request)
    {
        var sport = await _context.Sports.FindAsync(id)
            ?? throw new KeyNotFoundException("Không tìm thấy môn thể thao.");
        var name = request.Name.Trim();
        var slug = request.Slug.Trim().ToLowerInvariant();
        if (await _context.Sports.AnyAsync(x =>
                x.Id != id && (x.Name == name || x.Slug == slug)))
        {
            throw new InvalidOperationException("Tên hoặc slug môn thể thao đã tồn tại.");
        }

        sport.Name = name;
        sport.Slug = slug;
        sport.IconUrl = CleanOptional(request.IconUrl);
        sport.IsActive = request.IsActive;
        sport.UpdatedAt = DateTimeOffset.UtcNow;
        AddAudit("sport.updated", "sport", sport.Id, $"Updated sport tag {sport.Name}.");
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<object> UserReportTarget(Guid targetId)
    {
        return await _context.Users
            .AsNoTracking()
            .Where(x => x.Id == targetId)
            .Select(x => new
            {
                Kind = "user",
                Title = x.DisplayName,
                Subtitle = x.Email,
                x.Status,
                AppPath = $"/user/{x.Id}",
                Media = Array.Empty<object>()
            })
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Người dùng bị báo cáo không còn tồn tại.");
    }

    private async Task<object> PostReportTarget(Guid targetId)
    {
        return await _context.Posts
            .AsNoTracking()
            .Where(x => x.Id == targetId)
            .Select(x => new
            {
                Kind = "post",
                Title = string.IsNullOrWhiteSpace(x.Content)
                    ? "Bài viết không có nội dung chữ"
                    : x.Content,
                Subtitle = x.Group == null
                    ? "Bài viết cá nhân"
                    : $"Trong nhóm {x.Group.Name}",
                x.Status,
                AppPath = $"/post/{x.Id}",
                Media = x.Media
                    .OrderBy(media => media.SortOrder)
                    .Select(media => new
                    {
                        media.Id,
                        media.MediaType,
                        Url = $"/admin/post-media/{media.Id}"
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Bài viết bị báo cáo không còn tồn tại.");
    }

    private async Task<object> CommentReportTarget(Guid targetId)
    {
        return await _context.Comments
            .AsNoTracking()
            .Where(x => x.Id == targetId)
            .Select(x => new
            {
                Kind = "comment",
                Title = x.Content,
                Subtitle = "Bình luận trong bài viết",
                x.Status,
                AppPath = $"/post/{x.PostId}?commentId={x.Id}",
                Media = Array.Empty<object>()
            })
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Bình luận bị báo cáo không còn tồn tại.");
    }

    private async Task<object> GroupReportTarget(Guid targetId)
    {
        return await _context.Groups
            .AsNoTracking()
            .Where(x => x.Id == targetId)
            .Select(x => new
            {
                Kind = "group",
                Title = x.Name,
                Subtitle = x.Description ?? "Nhóm không có mô tả",
                x.Status,
                AppPath = $"/group/{x.Id}",
                Media = Array.Empty<object>()
            })
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Nhóm bị báo cáo không còn tồn tại.");
    }

    private static string? CleanOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static (int Page, int PageSize) Normalize(int page, int pageSize)
    {
        return (Math.Max(1, page), Math.Clamp(pageSize, 1, 100));
    }

    private Guid CurrentUserId()
    {
        return Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new UnauthorizedAccessException("User id trong token không hợp lệ.");
    }

    private void AddAudit(
        string action,
        string targetType,
        Guid targetId,
        string summary)
    {
        _context.AdminAuditLogs.Add(new AdminAuditLog
        {
            ActorId = CurrentUserId(),
            Action = action,
            TargetType = targetType,
            TargetId = targetId.ToString(),
            Summary = summary
        });
    }
}
