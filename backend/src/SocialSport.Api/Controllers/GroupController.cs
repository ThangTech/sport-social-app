using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SocialSport.Api.DTOs.Group;
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
