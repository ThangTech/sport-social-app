using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Repositories.Interfaces
{
    public interface ISavedPostRepository
    {
        Task<SavedPost?> GetAsync(Guid userId, Guid postId);
        Task<List<Post>> GetSavedPostsAsync(Guid userId);
        Task AddAsync(SavedPost savedPost);
        void Remove(SavedPost savedPost);
        Task SaveChangesAsync();
    }
}
