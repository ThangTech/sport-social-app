using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Repositories.Interfaces;

namespace SocialSport.Api.Repositories.Implementations;

public class UserBlockRepository : IUserBlockRepository
{
    private readonly ApplicationDbContext _context;

    public UserBlockRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> IsBlockedAsync(Guid blockerId, Guid blockedId)
    {
        return await _context.UserBlocks.AnyAsync(x => x.BlockerId == blockerId && x.BlockedId == blockedId);
    }

    public async Task<UserBlock?> GetAsync(Guid blockerId, Guid blockedId)
    {
        return await _context.UserBlocks.FirstOrDefaultAsync(x => x.BlockerId == blockerId && x.BlockedId == blockedId);
    }

    public async Task<List<ApplicationUser>> GetBlockedUsersAsync(Guid blockerId)
    {
        return await (
            from block in _context.UserBlocks
            join user in _context.Users on block.BlockedId equals user.Id
            where block.BlockerId == blockerId
            select user
        ).ToListAsync();
    }

    public async Task AddAsync(UserBlock userBlock)
    {
        await _context.UserBlocks.AddAsync(userBlock);
    }

    public void Remove(UserBlock userBlock)
    {
        _context.UserBlocks.Remove(userBlock);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}