using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;

namespace SocialSport.Api.Repositories.Implementations
{
    public class SavedPostRepository : ISavedPostRepository
    {
        private readonly ApplicationDbContext _context;

        public SavedPostRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<SavedPost?> GetAsync(Guid userId, Guid postId)
        {
            return await _context.SavedPosts.FirstOrDefaultAsync(x => x.UserId == userId && x.PostId == postId);
        }

        public async Task<List<Post>> GetSavedPostsAsync(Guid userId)
        {
            var query =
                from saved in _context.SavedPosts
                join post in _context.Posts on saved.PostId equals post.Id
                where saved.UserId == userId && post.Status == PostStatus.Published
                orderby saved.CreatedAt descending
                select post;

            return await query
                .AsNoTracking()
                .Include(x => x.Group)
                .Include(x => x.Sport)
                .Include(x => x.Media)
                .Include(x => x.Comments)
                .Include(x => x.Reactions)
                .ToListAsync();
        }

        public async Task AddAsync(SavedPost savedPost)
        {
            await _context.SavedPosts.AddAsync(savedPost);
        }

        public void Remove(SavedPost savedPost)
        {
            _context.SavedPosts.Remove(savedPost);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
