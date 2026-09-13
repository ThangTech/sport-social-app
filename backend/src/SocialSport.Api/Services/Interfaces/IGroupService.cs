using SocialSport.Api.DTOs.Group;

namespace SocialSport.Api.Services.Interfaces
{
    public interface IGroupService
    {
        Task<GroupDto> CreateAsync(Guid userId, CreateGroupRequest request);
        Task<GroupDto?> GetByIdAsync(Guid groupId, Guid? currentUserId);
        Task<GroupDto> UpdateAsync(Guid userId, Guid groupId, UpdateGroupRequest request);
        Task DeleteAsync(Guid userId, Guid groupId);
    }
}
