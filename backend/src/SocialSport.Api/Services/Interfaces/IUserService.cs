using SocialSport.Api.DTOs.User;

namespace SocialSport.Api.Services.Interfaces
{
    public interface IUserService
    {
        Task<List<UserSummaryDto>> GetFollowersAsync(Guid userId);
        Task<List<UserSummaryDto>> GetFollowingAsync(Guid userId);
        Task BlockAsync(Guid currentUserId, Guid targetUserId);
        Task UnblockAsync(Guid currentUserId, Guid targetUserId);
        Task<List<UserSummaryDto>> GetBlockedUsersAsync(Guid currentUserId);
        Task<UserProfileDto?> GetProfileAsync(Guid userId, Guid? currentUserId);
        Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
        Task FollowAsync(Guid currentUserId, Guid targetUserId);
        Task UnfollowAsync(Guid currentUserId, Guid targetUserId);
    }
}
