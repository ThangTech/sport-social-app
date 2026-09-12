using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SocialSport.Api.DTOs.Post;
using SocialSport.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialSport.Api.Controllers
{
    [ApiController]
    [Route("api/v1/posts")]
    public class PostsController : ControllerBase
    {
        private readonly IPostService _postService;

        public PostsController(IPostService postService)
        {
            _postService = postService;
        }
        [Authorize]
        [HttpPost("{id:guid}/reactions")]
        public async Task<ActionResult<ReactionResponse>> React(Guid id, ReactionRequest request)
        {
            return Ok(await _postService.ReactAsync(GetCurrentUserId(), id, request));
        }

        [Authorize]
        [HttpDelete("{id:guid}/reactions")]
        public async Task<ActionResult<ReactionResponse>> RemoveReaction(Guid id)
        {
            return Ok(await _postService.RemoveReactionAsync(GetCurrentUserId(), id));
        }
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<PostDto>> Create(CreatePostRequest request)
        {
            var post = await _postService.CreateAsync(GetCurrentUserId(), request);
            return Ok(post);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<PostDto>> GetById(Guid id)
        {
            var post = await _postService.GetByIdAsync(id);

            if (post is null)
                return NotFound();

            return Ok(post);
        }

        [Authorize]
        [HttpPatch("{id:guid}")]
        public async Task<ActionResult<PostDto>> Update(Guid id, UpdatePostRequest request)
        {
            var post = await _postService.UpdateAsync(GetCurrentUserId(), id, request);
            return Ok(post);
        }

        [Authorize]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _postService.DeleteAsync(GetCurrentUserId(), id);
            return NoContent();
        }

        [HttpGet("~/api/v1/users/{userId:guid}/posts")]
        public async Task<ActionResult<List<PostDto>>> GetUserPosts(Guid userId)
        {
            return Ok(await _postService.GetUserPostsAsync(userId));
        }

        private Guid GetCurrentUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(value, out var userId))
                throw new UnauthorizedAccessException("User id trong token không hợp lệ.");

            return userId;
        }
    }
}
