using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Repositories.Interfaces;

namespace SocialSport.Api.Repositories.Implementations
{
    public class SportRepository : ISportRepository
    {
        private readonly ApplicationDbContext _context;

        public SportRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Sport>> GetActiveAsync()
        {
            return await _context.Sports
                .AsNoTracking()
                .Where(x => x.IsActive)
                .OrderBy(x => x.Name)
                .ToListAsync();
        }
    }
}
