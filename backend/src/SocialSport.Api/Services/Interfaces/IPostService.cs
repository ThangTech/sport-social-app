using SocialSport.Api.DTOs.Post;

namespace SocialSport.Api.Services.Interfaces
{
    public interface IPostService
    {
        Task<ReactionResponse> ReactAsync(Guid userId, Guid postId, ReactionRequest request);
        Task<ReactionResponse> RemoveReactionAsync(Guid userId, Guid postId);
        Task<FeedResponse> GetFeedAsync(Guid userId, int limit, string? cursor);
        Task<PostDto> CreateAsync(Guid userId, CreatePostRequest request);
        Task<PostDto?> GetByIdAsync(Guid postId);
        Task<List<PostDto>> GetUserPostsAsync(Guid userId);
        Task<PostDto> UpdateAsync(Guid userId, Guid postId, UpdatePostRequest request);
        Task DeleteAsync(Guid userId, Guid postId);
    }
}
