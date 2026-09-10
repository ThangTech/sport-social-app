using SocialSport.Api.DTOs.User;

namespace SocialSport.Api.Services.Interfaces
{
    public interface IUserService
    {
        Task<UserProfileDto?> GetProfileAsync(Guid userId, Guid? currentUserId);
        Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
        Task FollowAsync(Guid currentUserId, Guid targetUserId);
        Task UnfollowAsync(Guid currentUserId, Guid targetUserId);
    }
}
