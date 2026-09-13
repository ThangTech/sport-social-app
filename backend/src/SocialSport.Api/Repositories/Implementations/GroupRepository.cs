using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.Models.Entities;
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
