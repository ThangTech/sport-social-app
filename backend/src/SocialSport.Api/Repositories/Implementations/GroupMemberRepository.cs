using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;

namespace SocialSport.Api.Repositories.Implementations
{
    public class GroupMemberRepository : IGroupMemberRepository
    {
        private readonly ApplicationDbContext _context;

        public GroupMemberRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<GroupMember?> GetAsync(Guid groupId, Guid userId)
        {
            return await _context.GroupMembers.FirstOrDefaultAsync(x => x.GroupId == groupId && x.UserId == userId);
        }

        public async Task<List<GroupMember>> GetByGroupAsync(Guid groupId, GroupMemberStatus status)
        {
            return await _context.GroupMembers
                .AsNoTracking()
                .Where(x => x.GroupId == groupId && x.Status == status)
                .OrderBy(x => x.JoinedAt)
                .ToListAsync();
        }

        public async Task AddAsync(GroupMember member)
        {
            await _context.GroupMembers.AddAsync(member);
        }

        public void Remove(GroupMember member)
        {
            _context.GroupMembers.Remove(member);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
