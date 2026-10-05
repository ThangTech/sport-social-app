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
    private readonly IExternalCopyrightScanService _externalScanService;
    private readonly ApplicationDbContext _context;

    public CopyrightController(
        ICopyrightService service,
        IExternalCopyrightScanService externalScanService,
        ApplicationDbContext context)
    {
        _service = service;
        _externalScanService = externalScanService;
        _context = context;
    }

    [Authorize(Roles = "ADMIN"), HttpPost("assets")]
    [RequestSizeLimit(210 * 1024 * 1024)]
    public async Task<IActionResult> CreateAsset(
        [FromForm] string title,
        [FromForm] string rightsOwnerName,
        [FromForm] string? evidenceNotes,
        [FromForm] IFormFile file)
    {
        var asset = await _service.CreateAssetAsync(UserId(), title, rightsOwnerName, evidenceNotes, file);
        await Audit(
            "copyright.asset.created",
            "copyright-asset",
            asset.Id,
            $"Đã đăng ký nội dung tham chiếu: {asset.Title}.");
        return Ok(new
        {
            asset.Id,
            asset.Title,
            asset.RightsOwnerName,
            asset.MediaType,
            asset.Status,
            asset.CreatedAt
        });
    }

    [Authorize(Roles = "ADMIN"), HttpGet("cases")]
    public async Task<IActionResult> Cases(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] CopyrightCaseStatus? status = null)
    {
        return Ok(await _service.GetCasesAsync(page, pageSize, status));
    }

    [Authorize(Roles = "ADMIN"), HttpGet("assets/{id:guid}/media")]
    public async Task<IActionResult> AssetMedia(Guid id)
    {
        var media = await _service.GetAssetMediaAsync(id);
        return PhysicalFile(media.Path, media.ContentType, enableRangeProcessing: true);
    }

    [Authorize(Roles = "ADMIN"), HttpGet("cases/{id:guid}/media")]
    public async Task<IActionResult> CaseMedia(Guid id)
    {
        var media = await _service.GetCaseMediaAsync(id);
        return PhysicalFile(media.Path, media.ContentType, enableRangeProcessing: true);
    }

    [Authorize(Roles = "ADMIN"), HttpPatch("cases/{id:guid}/decision")]
    public async Task<IActionResult> Decide(Guid id, CopyrightDecisionRequest request)
    {
        await _service.DecideAsync(UserId(), id, request);
        await Audit(
            "copyright.case.decided",
            "copyright-case",
            id,
            $"Đã xử lý hồ sơ bản quyền với trạng thái {request.Status}.");
        return NoContent();
    }

    [HttpGet("cases/me")]
    public async Task<IActionResult> Mine()
    {
        return Ok(await _service.GetMineAsync(UserId()));
    }

    [HttpPost("cases/{id:guid}/appeal")]
    public async Task<IActionResult> Appeal(Guid id, CopyrightAppealRequest request)
    {
        await _service.AppealAsync(UserId(), id, request);
        return NoContent();
    }

    [Authorize(Roles = "ADMIN"), HttpGet("external-scans")]
    public async Task<IActionResult> ExternalScans(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] ExternalCopyrightScanStatus? status = null)
    {
        return Ok(await _externalScanService.GetScansAsync(page, pageSize, status));
    }

    [HttpGet("external-scans/me")]
    public async Task<IActionResult> MyExternalScans()
    {
        return Ok(await _externalScanService.GetMineAsync(UserId()));
    }

    [HttpPost("external-scans/{id:guid}/appeal")]
    public async Task<IActionResult> AppealExternalScan(
        Guid id,
        CopyrightAppealRequest request)
    {
        await _externalScanService.AppealAsync(UserId(), id, request);
        return NoContent();
    }

    [Authorize(Roles = "ADMIN"), HttpGet("external-scans/{id:guid}/media")]
    public async Task<IActionResult> ExternalScanMedia(Guid id)
    {
        var media = await _externalScanService.GetMediaAsync(id);
        return PhysicalFile(media.Path, media.ContentType, enableRangeProcessing: true);
    }

    [Authorize(Roles = "ADMIN"), HttpPost("external-scans/{id:guid}/refresh")]
    public async Task<IActionResult> RefreshExternalScan(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _externalScanService.RefreshAsync(id, cancellationToken);
        await Audit(
            "copyright.external-scan.refreshed",
            "external-copyright-scan",
            id,
            $"Đã quét lại nội dung bằng {result.Provider}: {result.Status}.");
        return Ok(result);
    }

    [Authorize(Roles = "ADMIN"), HttpPatch("external-scans/{id:guid}/decision")]
    public async Task<IActionResult> DecideExternalScan(
        Guid id,
        ExternalCopyrightScanDecisionRequest request)
    {
        await _externalScanService.DecideAsync(UserId(), id, request);
        await Audit(
            "copyright.external-scan.decided",
            "external-copyright-scan",
            id,
            request.IsViolation
                ? "Admin xác nhận nội dung vi phạm."
                : "Admin xác nhận nội dung không vi phạm.");
        return NoContent();
    }

    private Guid UserId()
    {
        return Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new UnauthorizedAccessException("User id trong token không hợp lệ.");
    }

    private async Task Audit(string action, string targetType, Guid targetId, string summary)
    {
        _context.AdminAuditLogs.Add(new AdminAuditLog
        {
            ActorId = UserId(),
            Action = action,
            TargetType = targetType,
            TargetId = targetId.ToString(),
            Summary = summary
        });
        await _context.SaveChangesAsync();
    }
}
