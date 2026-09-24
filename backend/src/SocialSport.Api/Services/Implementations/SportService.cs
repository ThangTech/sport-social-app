using SocialSport.Api.DTOs.Sport;
using SocialSport.Api.Repositories.Interfaces;
using SocialSport.Api.Services.Interfaces;

namespace SocialSport.Api.Services.Implementations
{
    public class SportService : ISportService
    {
        private readonly ISportRepository _sportRepository;

        public SportService(ISportRepository sportRepository)
        {
            _sportRepository = sportRepository;
        }

        public async Task<List<SportDto>> GetAllAsync()
        {
            var sports = await _sportRepository.GetActiveAsync();

            return sports.Select(x => new SportDto
            {
                Id = x.Id,
                Name = x.Name,
                Slug = x.Slug,
                IconUrl = x.IconUrl
            }).ToList();
        }
    }
}
