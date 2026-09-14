using SocialSport.Api.DTOs.Group;

namespace SocialSport.Api.Services.Interfaces
{
    public interface IGroupService
    {
        Task<GroupDto> CreateAsync(Guid userId, CreateGroupRequest request);
        Task<GroupDto?> GetByIdAsync(Guid groupId, Guid? currentUserId);
        Task<GroupDto> UpdateAsync(Guid userId, Guid groupId, UpdateGroupRequest request);
        Task DeleteAsync(Guid userId, Guid groupId);
        Task<GroupMemberDto> JoinAsync(Guid userId, Guid groupId);
        Task LeaveAsync(Guid userId, Guid groupId);
        Task<List<GroupMemberDto>> GetMembersAsync(Guid groupId);
        Task<List<GroupMemberDto>> GetJoinRequestsAsync(Guid userId, Guid groupId);
        Task ApproveMemberAsync(Guid userId, Guid groupId, Guid targetUserId);
        Task RejectMemberAsync(Guid userId, Guid groupId, Guid targetUserId);

        Task UpdateMemberRoleAsync(Guid userId, Guid groupId, Guid targetUserId, UpdateGroupMemberRoleRequest request);
        Task RemoveMemberAsync(Guid userId, Guid groupId, Guid targetUserId);
        Task BanMemberAsync(Guid userId, Guid groupId, Guid targetUserId);
        Task UnbanMemberAsync(Guid userId, Guid groupId, Guid targetUserId);
    }
}
