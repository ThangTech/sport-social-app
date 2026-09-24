using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Repositories.Interfaces
{
    public interface ISportRepository
    {
        Task<List<Sport>> GetActiveAsync();
    }
}
