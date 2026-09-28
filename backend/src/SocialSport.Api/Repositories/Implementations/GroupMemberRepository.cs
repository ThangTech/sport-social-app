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

        public async Task<Dictionary<Guid, int>> GetActiveMemberCountsAsync(IReadOnlyCollection<Guid> groupIds)
        {
            if (groupIds.Count == 0)
                return [];

            return await _context.GroupMembers
                .AsNoTracking()
                .Where(x => groupIds.Contains(x.GroupId) && x.Status == GroupMemberStatus.Active)
                .GroupBy(x => x.GroupId)
                .ToDictionaryAsync(x => x.Key, x => x.Count());
        }

        public async Task<List<GroupMember>> GetByUserAndGroupsAsync(Guid userId, IReadOnlyCollection<Guid> groupIds)
        {
            if (groupIds.Count == 0)
                return [];

            return await _context.GroupMembers
                .AsNoTracking()
                .Where(x => x.UserId == userId && groupIds.Contains(x.GroupId))
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
