using SocialSport.Api.DTOs.Comment;

namespace SocialSport.Api.Services.Interfaces
{
    public interface ICommentService
    {
        Task<List<CommentDto>> GetByPostIdAsync(Guid postId);
        Task<CommentDto> CreateAsync(Guid userId, Guid postId, CreateCommentRequest request);
        Task<CommentDto> UpdateAsync(Guid userId, Guid commentId, UpdateCommentRequest request);
        Task DeleteAsync(Guid userId, Guid commentId);
    }
}
