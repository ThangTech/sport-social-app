using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Repositories.Interfaces
{
    public interface IUserBlockRepository
    {
        Task<bool> IsBlockedAsync(Guid blockerId, Guid blockedId);
        Task<UserBlock?> GetAsync(Guid blockerId, Guid blockedId);
        Task<List<ApplicationUser>> GetBlockedUsersAsync(Guid blockerId);
        Task AddAsync(UserBlock userBlock);
        void Remove(UserBlock userBlock);
        Task SaveChangesAsync();
    }
}
