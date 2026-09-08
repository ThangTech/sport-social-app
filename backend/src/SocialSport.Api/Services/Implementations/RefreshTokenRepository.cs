using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Repositories.Interfaces;

namespace SocialSport.Api.Repositories.Implementations;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly ApplicationDbContext _context;

    public RefreshTokenRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<RefreshToken?> GetByHashAsync(string tokenHash)
    {
        return await _context.RefreshTokens
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash);
    }

    public async Task AddAsync(RefreshToken refreshToken)
    {
        await _context.RefreshTokens.AddAsync(refreshToken);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}