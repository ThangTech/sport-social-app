using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialSport.Api.DTOs.Report;
using SocialSport.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialSport.Api.Controllers;

[ApiController, Authorize, Route("api/v1/reports")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _service;

    public ReportsController(IReportService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<ActionResult<ReportDto>> Create(
        CreateReportRequest request)
    {
        return Ok(await _service.CreateAsync(UserId(), request));
    }

    [HttpGet("me")]
    public async Task<ActionResult<List<ReportDto>>> Mine()
    {
        return Ok(await _service.GetMineAsync(UserId()));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ReportDto>> MineById(Guid id)
    {
        return Ok(await _service.GetMineByIdAsync(UserId(), id));
    }

    private Guid UserId()
    {
        return Guid.TryParse(
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            out var id)
            ? id
            : throw new UnauthorizedAccessException(
                "User id trong token không hợp lệ.");
    }
}
