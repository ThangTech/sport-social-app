using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Repositories.Interfaces
{
    public interface IGroupMemberRepository
    {
        Task<GroupMember?> GetAsync(Guid groupId, Guid userId);
        Task<List<GroupMember>> GetByGroupAsync(Guid groupId, GroupMemberStatus status);
        Task AddAsync(GroupMember member);
        void Remove(GroupMember member);
        Task SaveChangesAsync();
    }
}
