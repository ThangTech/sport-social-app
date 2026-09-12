using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;

namespace SocialSport.Api.Repositories.Implementations
{
    public class PostRepository : IPostRepository
    {
        private readonly ApplicationDbContext _context;

        public PostRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Post?> GetByIdAsync(Guid id)
        {
            return await _context.Posts
                .Include(x => x.Group)
                .Include(x => x.Sport)
                .Include(x => x.Media)
                .Include(x => x.Comments)
                .Include(x => x.Reactions)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<List<Post>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Posts
                .Include(x => x.Group)
                .Include(x => x.Sport)
                .Include(x => x.Media)
                .Include(x => x.Comments)
                .Include(x => x.Reactions)
                .Where(x => x.AuthorId == userId && x.Status == PostStatus.Published)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> SportExistsAsync(Guid sportId)
        {
            return await _context.Sports.AnyAsync(x => x.Id == sportId && x.IsActive);
        }

        public async Task AddAsync(Post post)
        {
            await _context.Posts.AddAsync(post);
        }
        public async Task<List<Post>> GetFeedAsync(Guid userId, int limit, DateTimeOffset? cursor)
        {
            var followingIds = _context.Follows.Where(x => x.FollowerId == userId).Select(x => x.FollowingId);

            var blockedByMe = _context.UserBlocks.Where(x => x.BlockerId == userId).Select(x => x.BlockedId);
            var blockedMe = _context.UserBlocks.Where(x => x.BlockedId == userId).Select(x => x.BlockerId);

            var query = _context.Posts
                .AsNoTracking()
                .Include(x => x.Group)
                .Include(x => x.Sport)
                .Include(x => x.Media)
                .Include(x => x.Comments)
                .Include(x => x.Reactions)
                .Where(x => x.Status == PostStatus.Published)
                .Where(x => x.GroupId == null)
                .Where(x => !blockedByMe.Contains(x.AuthorId) && !blockedMe.Contains(x.AuthorId))
                .Where(x =>
                    x.AuthorId == userId ||
                    x.Visibility == PostVisibility.Public ||
                    (x.Visibility == PostVisibility.Followers && followingIds.Contains(x.AuthorId)));

            if (cursor.HasValue)
                query = query.Where(x => x.CreatedAt < cursor.Value);

            return await query
                .OrderByDescending(x => x.CreatedAt)
                .Take(limit + 1)
                .ToListAsync();
        }
        public async Task<PostReaction?> GetReactionAsync(Guid postId, Guid userId)
        {
            return await _context.PostReactions.FirstOrDefaultAsync(x => x.PostId == postId && x.UserId == userId);
        }

        public async Task AddReactionAsync(PostReaction reaction)
        {
            await _context.PostReactions.AddAsync(reaction);
        }

        public void RemoveReaction(PostReaction reaction)
        {
            _context.PostReactions.Remove(reaction);
        }
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ExistsAsync(Guid postId)
        {
            return await _context.Posts.AnyAsync(x => x.Id == postId && x.Status == PostStatus.Published);
        }
    }
}
