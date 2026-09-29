using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialSport.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialSport.Api.Controllers;

[ApiController, Authorize, Route("api/v1/explore")]
public class ExploreController : ControllerBase
{
    private readonly IExploreService _service;

    public ExploreController(IExploreService service)
    {
        _service = service;
    }

    [HttpGet("posts")]
    public async Task<IActionResult> Posts(
        [FromQuery] string? search,
        [FromQuery] Guid? sportId,
        [FromQuery] string? sort = "recommended",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetPostsAsync(
            UserId(),
            search,
            sportId,
            sort,
            page,
            pageSize);

        return Ok(result);
    }

    [HttpGet("groups")]
    public async Task<IActionResult> Groups(
        [FromQuery] string? search,
        [FromQuery] string? sort = "recommended",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetGroupsAsync(
            UserId(),
            search,
            sort,
            page,
            pageSize);

        return Ok(result);
    }

    [HttpGet("users")]
    public async Task<IActionResult> Users(
        [FromQuery] string? search,
        [FromQuery] string? sort = "recommended",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetUsersAsync(
            UserId(),
            search,
            sort,
            page,
            pageSize);

        return Ok(result);
    }

    private Guid UserId()
    {
        return Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new UnauthorizedAccessException("User id trong token không hợp lệ.");
    }
}
