using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.DTOs.Admin;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Models.Entities;
using System.Security.Claims;

namespace SocialSport.Api.Controllers;

[ApiController, Authorize(Roles = "ADMIN"), Route("api/v1/admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public AdminController(ApplicationDbContext context) => _context = context;

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

    [HttpPatch("reports/{id:guid}/status")]
    public async Task<IActionResult> ReportStatus(Guid id, UpdateAdminStatusRequest request)
    {
        if (!Enum.IsDefined(typeof(ReportStatus), request.Status))
        {
            throw new InvalidOperationException("Trạng thái báo cáo không hợp lệ.");
        }
        var report = await _context.Reports.FindAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy báo cáo.");
        report.Status = (ReportStatus)request.Status;
        report.ReviewedBy = CurrentUserId();
        report.ReviewedAt = DateTimeOffset.UtcNow;
        AddAudit("report.status", "report", id, $"Set report status to {report.Status}.");
        await _context.SaveChangesAsync();
        return NoContent();
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
