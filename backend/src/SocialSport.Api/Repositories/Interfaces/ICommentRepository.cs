using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Repositories.Interfaces
{
    public interface ICommentRepository
    {
        Task<Comment?> GetByIdAsync(Guid id);
        Task<List<Comment>> GetByPostIdAsync(Guid postId);
        Task AddAsync(Comment comment);
        Task SaveChangesAsync();
    }
}
