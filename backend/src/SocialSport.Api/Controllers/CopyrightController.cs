using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialSport.Api.DTOs.Copyright;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Services.Interfaces;
using SocialSport.Api.Data;
using SocialSport.Api.Models.Entities;
using System.Security.Claims;

namespace SocialSport.Api.Controllers;

[ApiController, Authorize, Route("api/v1/copyright")]
public class CopyrightController : ControllerBase
{
    private readonly ICopyrightService _service;
    private readonly ApplicationDbContext _context;
    public CopyrightController(ICopyrightService service, ApplicationDbContext context) { _service = service; _context = context; }

    [Authorize(Roles = "ADMIN"), HttpPost("assets")]
    [RequestSizeLimit(210 * 1024 * 1024)]
    public async Task<IActionResult> CreateAsset([FromForm] string title, [FromForm] string rightsOwnerName, [FromForm] string? evidenceNotes, [FromForm] IFormFile file)
    {
        var asset = await _service.CreateAssetAsync(UserId(), title, rightsOwnerName, evidenceNotes, file);
        await Audit("copyright.asset.created", "copyright-asset", asset.Id, $"Registered rights reference: {asset.Title}.");
        return Ok(new { asset.Id, asset.Title, asset.RightsOwnerName, asset.MediaType, asset.Status, asset.CreatedAt });
    }

    [Authorize(Roles = "ADMIN"), HttpGet("cases")]
    public async Task<IActionResult> Cases([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] CopyrightCaseStatus? status = null) => Ok(await _service.GetCasesAsync(page, pageSize, status));

    [Authorize(Roles = "ADMIN"), HttpPatch("cases/{id:guid}/decision")]
    public async Task<IActionResult> Decide(Guid id, CopyrightDecisionRequest request) { await _service.DecideAsync(UserId(), id, request); await Audit("copyright.case.decided", "copyright-case", id, $"Copyright decision: {request.Status}."); return NoContent(); }

    [HttpGet("cases/me")]
    public async Task<IActionResult> Mine() => Ok(await _service.GetMineAsync(UserId()));

    [HttpPost("cases/{id:guid}/appeal")]
    public async Task<IActionResult> Appeal(Guid id, CopyrightAppealRequest request) { await _service.AppealAsync(UserId(), id, request); return NoContent(); }

    private Guid UserId() => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : throw new UnauthorizedAccessException("User id trong token không hợp lệ.");
    private async Task Audit(string action, string targetType, Guid targetId, string summary) { _context.AdminAuditLogs.Add(new AdminAuditLog { ActorId = UserId(), Action = action, TargetType = targetType, TargetId = targetId.ToString(), Summary = summary }); await _context.SaveChangesAsync(); }
}
