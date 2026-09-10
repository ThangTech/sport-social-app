using Microsoft.AspNetCore.Identity;
using SocialSport.Api.DTOs.User;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;
using SocialSport.Api.Services.Interfaces;

namespace SocialSport.Api.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IFollowRepository _followRepository;

        public UserService(UserManager<ApplicationUser> userManager, IFollowRepository followRepository)
        {
            _userManager = userManager;
            _followRepository = followRepository;
        }

        public async Task<UserProfileDto?> GetProfileAsync(Guid userId, Guid? currentUserId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user is null || user.Status != UserStatus.Active)
                return null;

            var followerCount = await _followRepository.GetFollowerCountAsync(userId);
            var followingCount = await _followRepository.GetFollowingCountAsync(userId);

            var isFollowing = false;

            if (currentUserId.HasValue && currentUserId.Value != userId)
                isFollowing = await _followRepository.IsFollowingAsync(currentUserId.Value, userId);

            return new UserProfileDto
            {
                Id = user.Id,
                UserName = user.UserName ?? string.Empty,
                DisplayName = user.DisplayName,
                AvatarUrl = user.AvatarUrl,
                CoverUrl = user.CoverUrl,
                Bio = user.Bio,
                DateOfBirth = user.DateOfBirth,
                FollowerCount = followerCount,
                FollowingCount = followingCount,
                IsFollowing = isFollowing
            };
        }

        public async Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user is null)
                throw new InvalidOperationException("Không tìm thấy người dùng.");

            user.DisplayName = request.DisplayName.Trim();
            user.Bio = request.Bio?.Trim();
            user.DateOfBirth = request.DateOfBirth;
            user.UpdatedAt = DateTimeOffset.UtcNow;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));

            return (await GetProfileAsync(userId, userId))!;
        }

        public async Task FollowAsync(Guid currentUserId, Guid targetUserId)
        {
            if (currentUserId == targetUserId)
                throw new InvalidOperationException("Bạn không thể follow chính mình.");

            var targetUser = await _userManager.FindByIdAsync(targetUserId.ToString());

            if (targetUser is null || targetUser.Status != UserStatus.Active)
                throw new InvalidOperationException("Không tìm thấy người dùng.");

            if (await _followRepository.IsFollowingAsync(currentUserId, targetUserId))
                return;

            var follow = new Follow
            {
                FollowerId = currentUserId,
                FollowingId = targetUserId,
                CreatedAt = DateTimeOffset.UtcNow
            };

            await _followRepository.AddAsync(follow);
            await _followRepository.SaveChangesAsync();
        }

        public async Task UnfollowAsync(Guid currentUserId, Guid targetUserId)
        {
            var follow = await _followRepository.GetAsync(currentUserId, targetUserId);

            if (follow is null)
                return;

            _followRepository.Remove(follow);
            await _followRepository.SaveChangesAsync();
        }
    }
}
