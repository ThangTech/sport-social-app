using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Repositories.Interfaces
{
    public interface IFollowRepository
    {
        Task<bool> IsFollowingAsync(Guid followerId, Guid followingId);
        Task<int> GetFollowerCountAsync(Guid userId);
        Task<int> GetFollowingCountAsync(Guid userId);
        Task AddAsync(Follow follow);
        Task<Follow?> GetAsync(Guid followerId, Guid followingId);
        void Remove(Follow follow);
        Task SaveChangesAsync();
    }
}
