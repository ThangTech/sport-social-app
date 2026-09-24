using SocialSport.Api.DTOs.Sport;

namespace SocialSport.Api.Services.Interfaces
{
    public interface ISportService
    {
        Task<List<SportDto>> GetAllAsync();
    }
}
