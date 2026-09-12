using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialSport.Api.DTOs.Post;
using SocialSport.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialSport.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/feed")]
public class FeedController : ControllerBase
{
    private readonly IPostService _postService;

    public FeedController(IPostService postService)
    {
        _postService = postService;
    }

    [HttpGet]
    public async Task<ActionResult<FeedResponse>> GetFeed([FromQuery] int limit = 20, [FromQuery] string? cursor = null)
    {
        var result = await _postService.GetFeedAsync(GetCurrentUserId(), limit, cursor);
        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(value, out var userId))
            throw new UnauthorizedAccessException("User id trong token không hợp lệ.");

        return userId;
    }
}