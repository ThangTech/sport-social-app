using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/posts/reviews/mine")]
public class MyPostReviewsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int page = 1)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var posts = await context.Posts.AsNoTracking()
            .Where(post => post.AuthorId == userId
                && post.GroupId == null
                && post.Status != PostStatus.Deleted)
            .OrderByDescending(post => post.CreatedAt)
            .Skip((Math.Max(1, page) - 1) * 20)
            .Take(20)
            .Select(post => new
            {
                post.Id,
                post.Content,
                post.Status,
                post.SystemModerationStatus,
                post.SystemModerationReason,
                post.CreatedAt
            })
            .ToListAsync();
        return Ok(posts);
    }
}
