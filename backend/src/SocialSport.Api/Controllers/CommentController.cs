using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialSport.Api.DTOs.Comment;
using SocialSport.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialSport.Api.Controllers;

[ApiController]
[Route("api/v1")]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpGet("posts/{postId:guid}/comments")]
    public async Task<ActionResult<List<CommentDto>>> GetComments(Guid postId)
    {
        return Ok(await _commentService.GetByPostIdAsync(postId));
    }

    [Authorize]
    [HttpPost("posts/{postId:guid}/comments")]
    public async Task<ActionResult<CommentDto>> Create(Guid postId, CreateCommentRequest request)
    {
        return Ok(await _commentService.CreateAsync(GetCurrentUserId(), postId, request));
    }

    [Authorize]
    [HttpPatch("comments/{id:guid}")]
    public async Task<ActionResult<CommentDto>> Update(Guid id, UpdateCommentRequest request)
    {
        return Ok(await _commentService.UpdateAsync(GetCurrentUserId(), id, request));
    }

    [Authorize]
    [HttpDelete("comments/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _commentService.DeleteAsync(GetCurrentUserId(), id);
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(value, out var userId))
            throw new UnauthorizedAccessException("User id trong token không hợp lệ.");

        return userId;
    }
}