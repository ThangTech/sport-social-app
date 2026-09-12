using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Repositories.Interfaces
{
    public interface IPostRepository
    {
        Task<List<Post>> GetFeedAsync(Guid userId, int limit, DateTimeOffset? cursor);
        Task<Post?> GetByIdAsync(Guid id);
        Task<List<Post>> GetByUserIdAsync(Guid userId);
        Task<bool> SportExistsAsync(Guid sportId);
        Task AddAsync(Post post);
        Task SaveChangesAsync();
    }
}
