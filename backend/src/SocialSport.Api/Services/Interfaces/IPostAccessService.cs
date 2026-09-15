using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Services.Interfaces
{
    public interface IPostAccessService
    {
        Task<bool> CanViewAsync(Guid? userId, Post post);
        Task EnsureCanViewAsync(Guid? userId, Post post);
        Task EnsureCanInteractAsync(Guid userId, Post post);
    }
}
