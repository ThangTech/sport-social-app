using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SocialSport.Api.DTOs.Group;
using SocialSport.Api.DTOs.Post;
using SocialSport.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialSport.Api.Controllers
{
    [ApiController]
    [Route("api/v1/groups")]
    public class GroupsController : ControllerBase
    {
        private readonly IGroupService _groupService;

        public GroupsController(IGroupService groupService)
        {
            _groupService = groupService;
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult<GroupDto>> Create(CreateGroupRequest request)
        {
            return Ok(await _groupService.CreateAsync(GetCurrentUserId(), request));
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<GroupDto>> GetById(Guid id)
        {
            var group = await _groupService.GetByIdAsync(id, TryGetCurrentUserId());

            if (group is null)
                return NotFound();

            return Ok(group);
        }

        [Authorize]
        [HttpPatch("{id:guid}")]
        public async Task<ActionResult<GroupDto>> Update(Guid id, UpdateGroupRequest request)
        {
            return Ok(await _groupService.UpdateAsync(GetCurrentUserId(), id, request));
        }

        [Authorize]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _groupService.DeleteAsync(GetCurrentUserId(), id);
            return NoContent();
        }
        [Authorize]
        [HttpPost("{id:guid}/join")]
        public async Task<ActionResult<GroupMemberDto>> Join(Guid id)
        {
            return Ok(await _groupService.JoinAsync(GetCurrentUserId(), id));
        }

        [Authorize]
        [HttpDelete("{id:guid}/leave")]
        public async Task<IActionResult> Leave(Guid id)
        {
            await _groupService.LeaveAsync(GetCurrentUserId(), id);
            return NoContent();
        }

        [HttpGet("{id:guid}/members")]
        public async Task<ActionResult<List<GroupMemberDto>>> GetMembers(Guid id)
        {
            return Ok(await _groupService.GetMembersAsync(TryGetCurrentUserId(), id));
        }

        [Authorize]
        [HttpGet("{id:guid}/join-requests")]
        public async Task<ActionResult<List<GroupMemberDto>>> GetJoinRequests(Guid id)
        {
            return Ok(await _groupService.GetJoinRequestsAsync(GetCurrentUserId(), id));
        }

        [Authorize]
        [HttpPost("{id:guid}/join-requests/{userId:guid}/approve")]
        public async Task<IActionResult> Approve(Guid id, Guid userId)
        {
            await _groupService.ApproveMemberAsync(GetCurrentUserId(), id, userId);
            return NoContent();
        }

        [Authorize]
        [HttpDelete("{id:guid}/join-requests/{userId:guid}")]
        public async Task<IActionResult> Reject(Guid id, Guid userId)
        {
            await _groupService.RejectMemberAsync(GetCurrentUserId(), id, userId);
            return NoContent();
        }
        [Authorize]
        [HttpPatch("{id:guid}/members/{userId:guid}/role")]
        public async Task<IActionResult> UpdateMemberRole(Guid id, Guid userId, UpdateGroupMemberRoleRequest request)
        {
            await _groupService.UpdateMemberRoleAsync(GetCurrentUserId(), id, userId, request);
            return NoContent();
        }

        [Authorize]
        [HttpDelete("{id:guid}/members/{userId:guid}")]
        public async Task<IActionResult> RemoveMember(Guid id, Guid userId)
        {
            await _groupService.RemoveMemberAsync(GetCurrentUserId(), id, userId);
            return NoContent();
        }

        [Authorize]
        [HttpPost("{id:guid}/members/{userId:guid}/ban")]
        public async Task<IActionResult> BanMember(Guid id, Guid userId)
        {
            await _groupService.BanMemberAsync(GetCurrentUserId(), id, userId);
            return NoContent();
        }

        [Authorize]
        [HttpDelete("{id:guid}/members/{userId:guid}/ban")]
        public async Task<IActionResult> UnbanMember(Guid id, Guid userId)
        {
            await _groupService.UnbanMemberAsync(GetCurrentUserId(), id, userId);
            return NoContent();
        }
        [Authorize]
        [HttpPost("{id:guid}/posts")]
        public async Task<ActionResult<PostDto>> CreatePost(Guid id, CreateGroupPostRequest request)
        {
            return Ok(await _groupService.CreatePostAsync(GetCurrentUserId(), id, request));
        }

        [HttpGet("{id:guid}/posts")]
        public async Task<ActionResult<GroupPostsResponse>> GetPosts(Guid id, [FromQuery] int limit = 20, [FromQuery] string? cursor = null)
        {
            return Ok(await _groupService.GetPostsAsync(TryGetCurrentUserId(), id, limit, cursor));
        }
        [Authorize]
        [HttpDelete("{id:guid}/posts/{postId:guid}")]
        public async Task<IActionResult> RemovePost(Guid id, Guid postId)
        {
            await _groupService.RemovePostAsync(GetCurrentUserId(), id, postId);
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
}
