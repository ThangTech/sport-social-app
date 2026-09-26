using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Repositories.Interfaces
{
    public interface IPostRepository
    {
        Task<List<Post>> GetGroupPostsAsync(Guid groupId, int limit, DateTimeOffset? cursor);
        Task<PostMedia?> GetMediaByIdAsync(Guid mediaId);
        Task AddMediaAsync(PostMedia media);
        void RemoveMedia(PostMedia media);
        Task<bool> ExistsAsync(Guid postId);
        Task<PostReaction?> GetReactionAsync(Guid postId, Guid userId);
        Task AddReactionAsync(PostReaction reaction);
        void RemoveReaction(PostReaction reaction);
        Task<List<Post>> GetFeedAsync(Guid userId, int limit, DateTimeOffset? cursor);
        Task<Post?> GetByIdAsync(Guid id);
        Task<Post?> GetByIdForAccessAsync(Guid id);
        Task<List<PostReaction>> GetReactionsAsync(Guid postId, int limit, DateTimeOffset? cursorReactedAt, Guid? cursorUserId);
        Task<List<Post>> GetByUserIdAsync(Guid userId);
        Task<bool> SportExistsAsync(Guid sportId);
        Task AddAsync(Post post);
        Task SaveChangesAsync();
    }
}
