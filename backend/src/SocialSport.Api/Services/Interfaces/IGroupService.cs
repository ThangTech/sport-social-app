using SocialSport.Api.DTOs.Group;
using SocialSport.Api.DTOs.Post;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Services.Interfaces
{
    public interface IGroupService
    {
        Task<GroupDto> CreateAsync(Guid userId, CreateGroupRequest request);
        Task<GroupsResponse> GetAllAsync(
            Guid? currentUserId,
            string? search,
            int limit,
            string? cursor,
            GroupListScope scope);
        Task<GroupDto?> GetByIdAsync(Guid groupId, Guid? currentUserId);
        Task<GroupDto> UpdateAsync(Guid userId, Guid groupId, UpdateGroupRequest request);
        Task<GroupDto> UpdateAvatarAsync(Guid userId, Guid groupId, IFormFile file);
        Task<GroupDto> DeleteAvatarAsync(Guid userId, Guid groupId);
        Task<GroupDto> UpdateCoverAsync(Guid userId, Guid groupId, IFormFile file);
        Task<GroupDto> DeleteCoverAsync(Guid userId, Guid groupId);
        Task DeleteAsync(Guid userId, Guid groupId);
        Task<GroupMemberDto> JoinAsync(Guid userId, Guid groupId);
        Task LeaveAsync(Guid userId, Guid groupId);
        Task<List<GroupMemberDto>> GetMembersAsync(Guid? currentUserId, Guid groupId);
        Task<List<GroupMemberDto>> GetJoinRequestsAsync(Guid userId, Guid groupId);
        Task ApproveMemberAsync(Guid userId, Guid groupId, Guid targetUserId);
        Task RejectMemberAsync(Guid userId, Guid groupId, Guid targetUserId);

        Task UpdateMemberRoleAsync(Guid userId, Guid groupId, Guid targetUserId, UpdateGroupMemberRoleRequest request);
        Task RemoveMemberAsync(Guid userId, Guid groupId, Guid targetUserId);
        Task BanMemberAsync(Guid userId, Guid groupId, Guid targetUserId);
        Task<List<GroupMemberDto>> GetBannedMembersAsync(Guid userId, Guid groupId);
        Task UnbanMemberAsync(Guid userId, Guid groupId, Guid targetUserId);

        Task<PostDto> CreatePostAsync(Guid userId, Guid groupId, CreateGroupPostRequest request);
        Task<GroupPostsResponse> GetPostsAsync(Guid? userId, Guid groupId, int limit, string? cursor);

        Task RemovePostAsync(Guid userId, Guid groupId, Guid postId);
    }
}
