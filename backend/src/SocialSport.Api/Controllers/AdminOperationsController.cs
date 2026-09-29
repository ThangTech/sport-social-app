using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.DTOs.Admin;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Controllers;

[ApiController, Authorize(Roles = "ADMIN"), Route("api/v1/admin")]
public class AdminOperationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminOperationsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var since = DateTimeOffset.UtcNow.AddDays(-7);
        return Ok(new
        {
            totals = new
            {
                users = await _context.Users.CountAsync(),
                groups = await _context.Groups.CountAsync(x => x.DeletedAt == null),
                posts = await _context.Posts.CountAsync(x => x.DeletedAt == null),
                reportsPending = await _context.Reports.CountAsync(x => x.Status == ReportStatus.Pending),
                copyrightPending = await _context.CopyrightCases.CountAsync(x => x.Status == CopyrightCaseStatus.Pending || x.Status == CopyrightCaseStatus.Appealed),
                openTasks = await _context.OperationalTasks.CountAsync(x => x.Status != OperationalTaskStatus.Completed),
                openIncidents = await _context.Incidents.CountAsync(x => x.Status != IncidentStatus.Resolved)
            },
            activity = new
            {
                newUsers7d = await _context.Users.CountAsync(x => x.CreatedAt >= since),
                newGroups7d = await _context.Groups.CountAsync(x => x.CreatedAt >= since && x.DeletedAt == null),
                newPosts7d = await _context.Posts.CountAsync(x => x.CreatedAt >= since && x.DeletedAt == null),
                reports7d = await _context.Reports.CountAsync(x => x.CreatedAt >= since)
            },
            recentAudit = await _context.AdminAuditLogs.AsNoTracking().OrderByDescending(x => x.CreatedAt).Take(8)
                .Select(x => new { x.Id, x.ActorId, x.Action, x.TargetType, x.TargetId, x.Summary, x.CreatedAt }).ToListAsync()
        });
    }

    [HttpGet("health")]
    public async Task<IActionResult> Health()
    {
        var databaseOk = false;
        try { databaseOk = await _context.Database.CanConnectAsync(); } catch { }
        var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        return Ok(new
        {
            status = databaseOk ? "healthy" : "degraded",
            checkedAt = DateTimeOffset.UtcNow,
            services = new[]
            {
                new { name = "API", status = "healthy", detail = "HTTP pipeline is responding" },
                new { name = "Database", status = databaseOk ? "healthy" : "unavailable", detail = databaseOk ? "Connection succeeded" : "Connection failed" },
                new { name = "Media storage", status = Directory.Exists(uploadPath) ? "healthy" : "degraded", detail = Directory.Exists(uploadPath) ? "Upload directory is available" : "Upload directory has not been created" }
            }
        });
    }

    [HttpGet("roles")]
    public async Task<IActionResult> Roles()
    {
        var adminRole = await _context.Roles.AsNoTracking().SingleAsync(x => x.NormalizedName == "ADMIN");
        var count = await _context.UserRoles.CountAsync(x => x.RoleId == adminRole.Id);
        return Ok(new[]
        {
            new
            {
                name = "ADMIN",
                displayName = "System Administrator",
                accessLevel = "Full system administration",
                responsibilities = new[] { "System health and operations", "Users, groups and content", "Reports and copyright review", "Incidents and contingency plans", "Administrator access" },
                permissions = new[] { "dashboard:read", "users:manage", "groups:manage", "posts:manage", "reports:manage", "copyright:manage", "operations:manage", "incidents:manage", "admins:manage" },
                userCount = count
            }
        });
    }

    [HttpGet("administrators")]
    public async Task<IActionResult> Administrators()
    {
        var admins = await _userManager.GetUsersInRoleAsync("ADMIN");
        return Ok(admins.OrderBy(x => x.DisplayName).Select(x => new { x.Id, x.DisplayName, x.Email, x.Status, x.CreatedAt }));
    }

    [HttpPost("administrators/{userId:guid}")]
    public async Task<IActionResult> GrantAdministrator(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString()) ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");
        if (!await _userManager.IsInRoleAsync(user, "ADMIN"))
        {
            var result = await _userManager.AddToRoleAsync(user, "ADMIN");
            if (!result.Succeeded) throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));
            await Audit("admin.granted", "user", userId.ToString(), $"Granted System Admin access to {user.Email}.");
        }
        return NoContent();
    }

    [HttpDelete("administrators/{userId:guid}")]
    public async Task<IActionResult> RevokeAdministrator(Guid userId)
    {
        if (userId == CurrentUserId()) throw new InvalidOperationException("Không thể tự thu hồi quyền quản trị.");
        var user = await _userManager.FindByIdAsync(userId.ToString()) ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");
        var admins = await _userManager.GetUsersInRoleAsync("ADMIN");
        if (admins.Count <= 1) throw new InvalidOperationException("Hệ thống phải còn ít nhất một System Admin.");
        if (await _userManager.IsInRoleAsync(user, "ADMIN"))
        {
            var result = await _userManager.RemoveFromRoleAsync(user, "ADMIN");
            if (!result.Succeeded) throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));
            await Audit("admin.revoked", "user", userId.ToString(), $"Revoked System Admin access from {user.Email}.");
        }
        return NoContent();
    }

    [HttpGet("operations/tasks")]
    public async Task<IActionResult> Tasks([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        (page, pageSize) = Normalize(page, pageSize); var q = _context.OperationalTasks.AsNoTracking().OrderBy(x => x.Status == OperationalTaskStatus.Completed).ThenByDescending(x => x.Priority).ThenBy(x => x.DueAt);
        return Ok(new { items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(), total = await q.CountAsync(), page, pageSize });
    }

    [HttpPost("operations/tasks")]
    public async Task<IActionResult> CreateTask(CreateOperationalTaskRequest request)
    {
        EnsureEnum(request.Priority); var item = new OperationalTask { Title = request.Title.Trim(), Description = request.Description?.Trim(), Procedure = request.Procedure?.Trim(), Priority = request.Priority, AssignedTo = request.AssignedTo, DueAt = request.DueAt, CreatedBy = CurrentUserId() };
        _context.Add(item); AddAudit("task.created", "operational-task", item.Id.ToString(), item.Title); await _context.SaveChangesAsync(); return CreatedAtAction(nameof(Tasks), new { }, item);
    }

    [HttpPatch("operations/tasks/{id:guid}")]
    public async Task<IActionResult> UpdateTask(Guid id, UpdateOperationalTaskRequest request)
    {
        EnsureEnum(request.Status); var item = await _context.OperationalTasks.FindAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy tác vụ.");
        item.Status = request.Status; item.AssignedTo = request.AssignedTo; item.DueAt = request.DueAt; item.UpdatedAt = DateTimeOffset.UtcNow; item.CompletedAt = request.Status == OperationalTaskStatus.Completed ? DateTimeOffset.UtcNow : null;
        AddAudit("task.updated", "operational-task", id.ToString(), $"{item.Title}: {request.Status}"); await _context.SaveChangesAsync(); return NoContent();
    }

    [HttpGet("operations/changes")]
    public async Task<IActionResult> Changes([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        (page, pageSize) = Normalize(page, pageSize); var q = _context.ChangeRequests.AsNoTracking().OrderByDescending(x => x.CreatedAt);
        return Ok(new { items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(), total = await q.CountAsync(), page, pageSize });
    }

    [HttpPost("operations/changes")]
    public async Task<IActionResult> CreateChange(CreateChangeRequest request)
    {
        var item = new ChangeRequest { Title = request.Title.Trim(), Description = request.Description.Trim(), ImplementationPlan = request.ImplementationPlan.Trim(), RollbackPlan = request.RollbackPlan.Trim(), RiskLevel = request.RiskLevel, ScheduledAt = request.ScheduledAt, RequestedBy = CurrentUserId() };
        _context.Add(item); AddAudit("change.created", "change-request", item.Id.ToString(), item.Title); await _context.SaveChangesAsync(); return CreatedAtAction(nameof(Changes), new { }, item);
    }

    [HttpPatch("operations/changes/{id:guid}/status")]
    public async Task<IActionResult> UpdateChange(Guid id, UpdateChangeStatusRequest request)
    {
        EnsureEnum(request.Status); var item = await _context.ChangeRequests.FindAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy yêu cầu thay đổi.");
        item.Status = request.Status; item.UpdatedAt = DateTimeOffset.UtcNow; if (request.Status == ChangeRequestStatus.Approved) item.ApprovedBy = CurrentUserId(); if (request.Status is ChangeRequestStatus.Completed or ChangeRequestStatus.Failed or ChangeRequestStatus.RolledBack) item.CompletedAt = DateTimeOffset.UtcNow;
        AddAudit("change.status", "change-request", id.ToString(), $"{item.Title}: {request.Status}"); await _context.SaveChangesAsync(); return NoContent();
    }

    [HttpGet("incidents")]
    public async Task<IActionResult> Incidents([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        (page, pageSize) = Normalize(page, pageSize); var q = _context.Incidents.AsNoTracking().OrderBy(x => x.Status == IncidentStatus.Resolved).ThenByDescending(x => x.Severity).ThenByDescending(x => x.DetectedAt);
        return Ok(new { items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(), total = await q.CountAsync(), page, pageSize });
    }

    [HttpPost("incidents")]
    public async Task<IActionResult> CreateIncident(CreateIncidentRequest request)
    {
        EnsureEnum(request.Severity); var item = new Incident { Title = request.Title.Trim(), Summary = request.Summary.Trim(), Impact = request.Impact?.Trim(), Severity = request.Severity, OwnerId = request.OwnerId, CreatedBy = CurrentUserId() };
        _context.Add(item); AddAudit("incident.created", "incident", item.Id.ToString(), item.Title); await _context.SaveChangesAsync(); return CreatedAtAction(nameof(Incidents), new { }, item);
    }

    [HttpPatch("incidents/{id:guid}")]
    public async Task<IActionResult> UpdateIncident(Guid id, UpdateIncidentRequest request)
    {
        EnsureEnum(request.Status); var item = await _context.Incidents.FindAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy sự cố.");
        item.Status = request.Status; item.OwnerId = request.OwnerId; item.ResponseNotes = request.ResponseNotes?.Trim(); item.RootCause = request.RootCause?.Trim(); item.UpdatedAt = DateTimeOffset.UtcNow; item.ResolvedAt = request.Status == IncidentStatus.Resolved ? DateTimeOffset.UtcNow : null;
        AddAudit("incident.updated", "incident", id.ToString(), $"{item.Title}: {request.Status}"); await _context.SaveChangesAsync(); return NoContent();
    }

    [HttpGet("contingency-plans")]
    public async Task<IActionResult> Plans() => Ok(await _context.ContingencyPlans.AsNoTracking().OrderByDescending(x => x.IsActive).ThenBy(x => x.Name).ToListAsync());

    [HttpPost("contingency-plans")]
    public async Task<IActionResult> CreatePlan(SaveContingencyPlanRequest request)
    {
        var item = new ContingencyPlan { Name = request.Name.Trim(), TriggerConditions = request.TriggerConditions.Trim(), ResponseSteps = request.ResponseSteps.Trim(), RecoverySteps = request.RecoverySteps.Trim(), Owner = request.Owner.Trim(), IsActive = request.IsActive, CreatedBy = CurrentUserId() };
        _context.Add(item); AddAudit("plan.created", "contingency-plan", item.Id.ToString(), item.Name); await _context.SaveChangesAsync(); return CreatedAtAction(nameof(Plans), new { }, item);
    }

    [HttpPut("contingency-plans/{id:guid}")]
    public async Task<IActionResult> UpdatePlan(Guid id, SaveContingencyPlanRequest request)
    {
        var item = await _context.ContingencyPlans.FindAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy kế hoạch dự phòng.");
        item.Name = request.Name.Trim(); item.TriggerConditions = request.TriggerConditions.Trim(); item.ResponseSteps = request.ResponseSteps.Trim(); item.RecoverySteps = request.RecoverySteps.Trim(); item.Owner = request.Owner.Trim(); item.IsActive = request.IsActive; item.Version++; item.UpdatedAt = DateTimeOffset.UtcNow;
        AddAudit("plan.updated", "contingency-plan", id.ToString(), $"{item.Name} v{item.Version}"); await _context.SaveChangesAsync(); return NoContent();
    }

    [HttpGet("audit")]
    public async Task<IActionResult> AuditLog([FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        (page, pageSize) = Normalize(page, pageSize); var q = _context.AdminAuditLogs.AsNoTracking().OrderByDescending(x => x.CreatedAt);
        return Ok(new { items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(), total = await q.CountAsync(), page, pageSize });
    }

    private Guid CurrentUserId() => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : throw new UnauthorizedAccessException("User id trong token không hợp lệ.");
    private static (int, int) Normalize(int page, int pageSize) => (Math.Max(1, page), Math.Clamp(pageSize, 1, 100));
    private static void EnsureEnum<T>(T value) where T : struct, Enum { if (!Enum.IsDefined(value)) throw new InvalidOperationException("Trạng thái không hợp lệ."); }
    private void AddAudit(string action, string targetType, string? targetId, string summary) => _context.AdminAuditLogs.Add(new AdminAuditLog { ActorId = CurrentUserId(), Action = action, TargetType = targetType, TargetId = targetId, Summary = summary });
    private async Task Audit(string action, string targetType, string? targetId, string summary) { AddAudit(action, targetType, targetId, summary); await _context.SaveChangesAsync(); }
}
