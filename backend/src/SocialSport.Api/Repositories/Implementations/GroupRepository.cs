using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;

namespace SocialSport.Api.Repositories.Implementations
{
    public class GroupRepository : IGroupRepository
    {
        private readonly ApplicationDbContext _context;

        public GroupRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Group?> GetByIdAsync(Guid id)
        {
            return await _context.Groups
                .Include(x => x.Members)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<List<Group>> GetListAsync(
            string? search,
            int limit,
            DateTimeOffset? cursorCreatedAt,
            Guid? cursorGroupId,
            Guid? currentUserId)
        {
            var query = _context.Groups
                .AsNoTracking()
                .Where(x => x.Status == GroupStatus.Active);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(x => x.Name.Contains(search));

            if (currentUserId.HasValue)
            {
                query = query.Where(x => !x.Members.Any(member =>
                    member.UserId == currentUserId.Value &&
                    member.Status == GroupMemberStatus.Banned));
            }

            if (cursorCreatedAt.HasValue && cursorGroupId.HasValue)
            {
                query = query.Where(x =>
                    x.CreatedAt < cursorCreatedAt.Value ||
                    (x.CreatedAt == cursorCreatedAt.Value && x.Id.CompareTo(cursorGroupId.Value) < 0));
            }

            return await query
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
                .Take(limit + 1)
                .ToListAsync();
        }

        public async Task<bool> SlugExistsAsync(string slug)
        {
            return await _context.Groups.AnyAsync(x => x.Slug == slug);
        }

        public async Task AddAsync(Group group)
        {
            await _context.Groups.AddAsync(group);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
