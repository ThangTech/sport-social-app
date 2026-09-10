
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Repositories.Interfaces;

namespace SocialSport.Api.Repositories.Implementations
{
    public class FollowRepository : IFollowRepository
    {
        private readonly ApplicationDbContext _context;

        public FollowRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> IsFollowingAsync(Guid followerId, Guid followingId)
        {
            return await _context.Follows.AnyAsync(x => x.FollowerId == followerId && x.FollowingId == followingId);
        }

        public async Task<int> GetFollowerCountAsync(Guid userId)
        {
            return await _context.Follows.CountAsync(x => x.FollowingId == userId);
        }

        public async Task<int> GetFollowingCountAsync(Guid userId)
        {
            return await _context.Follows.CountAsync(x => x.FollowerId == userId);
        }

        public async Task AddAsync(Follow follow)
        {
            await _context.Follows.AddAsync(follow);
        }

        public async Task<Follow?> GetAsync(Guid followerId, Guid followingId)
        {
            return await _context.Follows.FirstOrDefaultAsync(x => x.FollowerId == followerId && x.FollowingId == followingId);
        }

        public void Remove(Follow follow)
        {
            _context.Follows.Remove(follow);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<List<ApplicationUser>> GetFollowersAsync(Guid userId)
        {
                return await(
                from follow in _context.Follows
                join user in _context.Users on follow.FollowerId equals user.Id
                where follow.FollowingId == userId
                select user).ToListAsync();
        }

        public async Task<List<ApplicationUser>> GetFollowingAsync(Guid userId)
        {
            return await(
            from follow in _context.Follows
            join user in _context.Users on follow.FollowingId equals user.Id
            where follow.FollowerId == userId
            select user).ToListAsync();
        }
    }
}
