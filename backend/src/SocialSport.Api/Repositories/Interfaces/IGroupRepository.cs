using SocialSport.Api.Models.Entities;

using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Repositories.Interfaces
{
    public interface IGroupRepository
    {
        Task<Group?> GetByIdAsync(Guid id);
        Task<List<Group>> GetListAsync(
            string? search,
            int limit,
            DateTimeOffset? cursorCreatedAt,
            Guid? cursorGroupId,
            Guid? currentUserId,
            GroupListScope scope);
        Task<bool> SlugExistsAsync(string slug);
        Task AddAsync(Group group);
        Task SaveChangesAsync();
    }
}
