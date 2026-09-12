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
        [HttpPut("{postId:guid}/media/{mediaId:guid}")]
        public async Task<ActionResult<PostMediaUploadResponse>> UpdateMedia(Guid postId, Guid mediaId, IFormFile file)
        {
            return Ok(await _postService.UpdateMediaAsync(GetCurrentUserId(), postId, mediaId, file));
        }
        [Authorize]
        [HttpPost("{id:guid}/media")]
        public async Task<ActionResult<PostMediaUploadResponse>> UploadMedia(Guid id, IFormFile file)
        {
            return Ok(await _postService.UploadMediaAsync(GetCurrentUserId(), id, file));
        }

        [Authorize]
        [HttpDelete("{postId:guid}/media/{mediaId:guid}")]
        public async Task<IActionResult> DeleteMedia(Guid postId, Guid mediaId)
        {
            await _postService.DeleteMediaAsync(GetCurrentUserId(), postId, mediaId);
            return NoContent();
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
        [Authorize]
        [HttpPost("{id:guid}/save")]
        public async Task<IActionResult> Save(Guid id)
        {
            await _postService.SavePostAsync(GetCurrentUserId(), id);
            return NoContent();
        }

        [Authorize]
        [HttpDelete("{id:guid}/save")]
        public async Task<IActionResult> Unsave(Guid id)
        {
            await _postService.UnsavePostAsync(GetCurrentUserId(), id);
            return NoContent();
        }

        [Authorize]
        [HttpGet("saved")]
        public async Task<ActionResult<List<PostDto>>> GetSavedPosts()
        {
            return Ok(await _postService.GetSavedPostsAsync(GetCurrentUserId()));
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
