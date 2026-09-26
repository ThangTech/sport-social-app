using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialSport.Api.DTOs.User;
using SocialSport.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialSport.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }
    [HttpGet("{id:guid}/followers")]
    public async Task<ActionResult<List<UserSummaryDto>>> GetFollowers(Guid id)
    {
        return Ok(await _userService.GetFollowersAsync(id));
    }

    [HttpGet("{id:guid}/following")]
    public async Task<ActionResult<List<UserSummaryDto>>> GetFollowing(Guid id)
    {
        return Ok(await _userService.GetFollowingAsync(id));
    }

    [Authorize]
    [HttpPost("{id:guid}/block")]
    public async Task<IActionResult> Block(Guid id)
    {
        await _userService.BlockAsync(GetCurrentUserId(), id);
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id:guid}/block")]
    public async Task<IActionResult> Unblock(Guid id)
    {
        await _userService.UnblockAsync(GetCurrentUserId(), id);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me/blocked-users")]
    public async Task<ActionResult<List<UserSummaryDto>>> GetBlockedUsers()
    {
        return Ok(await _userService.GetBlockedUsersAsync(GetCurrentUserId()));
    }
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserProfileDto>> GetProfile(Guid id)
    {
        var currentUserId = TryGetCurrentUserId();
        var user = await _userService.GetProfileAsync(id, currentUserId);

        if (user is null)
            return NotFound();

        return Ok(user);
    }

    [Authorize]
    [HttpPatch("me")]
    public async Task<ActionResult<UserProfileDto>> UpdateProfile(UpdateProfileRequest request)
    {
        var userId = GetCurrentUserId();
        var user = await _userService.UpdateProfileAsync(userId, request);

        return Ok(user);
    }

    [Authorize]
    [HttpPut("me/avatar")]
    public async Task<ActionResult<UserProfileDto>> UpdateAvatar([FromForm] IFormFile file)
    {
        return Ok(await _userService.UpdateAvatarAsync(GetCurrentUserId(), file));
    }

    [Authorize]
    [HttpDelete("me/avatar")]
    public async Task<ActionResult<UserProfileDto>> DeleteAvatar()
    {
        return Ok(await _userService.DeleteAvatarAsync(GetCurrentUserId()));
    }

    [Authorize]
    [HttpPut("me/cover")]
    public async Task<ActionResult<UserProfileDto>> UpdateCover([FromForm] IFormFile file)
    {
        return Ok(await _userService.UpdateCoverAsync(GetCurrentUserId(), file));
    }

    [Authorize]
    [HttpDelete("me/cover")]
    public async Task<ActionResult<UserProfileDto>> DeleteCover()
    {
        return Ok(await _userService.DeleteCoverAsync(GetCurrentUserId()));
    }

    [Authorize]
    [HttpPost("{id:guid}/follow")]
    public async Task<IActionResult> Follow(Guid id)
    {
        await _userService.FollowAsync(GetCurrentUserId(), id);
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id:guid}/follow")]
    public async Task<IActionResult> Unfollow(Guid id)
    {
        await _userService.UnfollowAsync(GetCurrentUserId(), id);
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(value, out var userId))
            throw new UnauthorizedAccessException("User id trong token không hợp lệ.");

        return userId;
    }

    private Guid? TryGetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var userId) ? userId : null;
    }
}
