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
        private readonly IUserBlockRepository _userBlockRepository;

        public UserService(UserManager<ApplicationUser> userManager, IFollowRepository followRepository, IUserBlockRepository userBlockRepository)
        {
            _userManager = userManager;
            _followRepository = followRepository;
            _userBlockRepository = userBlockRepository;
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

        public async Task<List<UserSummaryDto>> GetFollowersAsync(Guid userId)
        {
            var users = await _followRepository.GetFollowersAsync(userId);
            return users.Select(u => new UserSummaryDto
            {
                Id = u.Id,
                UserName = u.UserName ?? string.Empty,
                DisplayName = u.DisplayName,
                AvatarUrl = u.AvatarUrl
            }).ToList();
        }

        public async Task<List<UserSummaryDto>> GetFollowingAsync(Guid userId)
        {
            var users = await _followRepository.GetFollowingAsync(userId);
            return users.Select(u => new UserSummaryDto
            {
                Id = u.Id,
                UserName = u.UserName ?? string.Empty,
                DisplayName = u.DisplayName,
                AvatarUrl = u.AvatarUrl
            }).ToList();
        }

        public async Task BlockAsync(Guid currentUserId, Guid targetUserId)
        {
            if (currentUserId == targetUserId)
                throw new InvalidOperationException("Bạn không thể block chính mình.");

            var targetUser = await _userManager.FindByIdAsync(targetUserId.ToString());

            if (targetUser is null)
                throw new InvalidOperationException("Không tìm thấy người dùng.");

            if (await _userBlockRepository.IsBlockedAsync(currentUserId, targetUserId))
                return;

            var userBlock = new UserBlock
            {
                BlockerId = currentUserId,
                BlockedId = targetUserId,
                CreatedAt = DateTimeOffset.UtcNow
            };

            await _userBlockRepository.AddAsync(userBlock);
            await _userBlockRepository.SaveChangesAsync();
        }

        public async Task UnblockAsync(Guid currentUserId, Guid targetUserId)
        {
            var userBlock = await _userBlockRepository.GetAsync(currentUserId, targetUserId);

            if (userBlock is null)
                return;

            _userBlockRepository.Remove(userBlock);
            await _userBlockRepository.SaveChangesAsync();
        }

        public async Task<List<UserSummaryDto>> GetBlockedUsersAsync(Guid currentUserId)
        {
            var users = await _userBlockRepository.GetBlockedUsersAsync(currentUserId);
            return users.Select(u => new UserSummaryDto
            {
                Id = u.Id,
                UserName = u.UserName ?? string.Empty,
                DisplayName = u.DisplayName,
                AvatarUrl = u.AvatarUrl
            }).ToList();
        }
    }
}
