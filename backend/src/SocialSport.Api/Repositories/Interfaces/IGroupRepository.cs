using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Repositories.Interfaces
{
    public interface IGroupRepository
    {
        Task<Group?> GetByIdAsync(Guid id);
        Task<bool> SlugExistsAsync(string slug);
        Task AddAsync(Group group);
        Task SaveChangesAsync();
    }
}
