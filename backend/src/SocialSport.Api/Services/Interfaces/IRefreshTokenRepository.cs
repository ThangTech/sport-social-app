using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Repositories.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByHashAsync(string tokenHash);

    Task AddAsync(RefreshToken refreshToken);

    Task SaveChangesAsync();
}