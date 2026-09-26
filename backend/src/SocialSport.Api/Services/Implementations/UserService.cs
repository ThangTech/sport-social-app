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
        private const long MaxAvatarFileSize = 5 * 1024 * 1024;
        private const long MaxCoverFileSize = 10 * 1024 * 1024;

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IFollowRepository _followRepository;
        private readonly IUserBlockRepository _userBlockRepository;
        private readonly IWebHostEnvironment _environment;

        public UserService(UserManager<ApplicationUser> userManager, IFollowRepository followRepository, IUserBlockRepository userBlockRepository, IWebHostEnvironment environment)
        {
            _userManager = userManager;
            _followRepository = followRepository;
            _userBlockRepository = userBlockRepository;
            _environment = environment;
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

            var displayName = request.DisplayName.Trim();

            if (displayName.Length < 2)
                throw new InvalidOperationException("Tên hiển thị phải có ít nhất 2 ký tự sau khi loại bỏ khoảng trắng ở đầu và cuối.");

            if (request.DateOfBirth > DateOnly.FromDateTime(DateTime.UtcNow))
                throw new InvalidOperationException("Ngày sinh không được lớn hơn ngày hiện tại.");

            user.DisplayName = displayName;
            user.Bio = request.Bio?.Trim();
            user.DateOfBirth = request.DateOfBirth;
            user.UpdatedAt = DateTimeOffset.UtcNow;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));

            return (await GetProfileAsync(userId, userId))!;
        }

        public Task<UserProfileDto> UpdateAvatarAsync(Guid userId, IFormFile file)
        {
            return UpdateProfileImageAsync(userId, file, ProfileImageKind.Avatar);
        }

        public Task<UserProfileDto> DeleteAvatarAsync(Guid userId)
        {
            return DeleteProfileImageAsync(userId, ProfileImageKind.Avatar);
        }

        public Task<UserProfileDto> UpdateCoverAsync(Guid userId, IFormFile file)
        {
            return UpdateProfileImageAsync(userId, file, ProfileImageKind.Cover);
        }

        public Task<UserProfileDto> DeleteCoverAsync(Guid userId)
        {
            return DeleteProfileImageAsync(userId, ProfileImageKind.Cover);
        }

        private async Task<UserProfileDto> UpdateProfileImageAsync(Guid userId, IFormFile file, ProfileImageKind imageKind)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user is null)
                throw new InvalidOperationException("Không tìm thấy người dùng.");

            var maxFileSize = imageKind == ProfileImageKind.Avatar ? MaxAvatarFileSize : MaxCoverFileSize;
            var extension = await ValidateImageAsync(file, maxFileSize);
            var folderName = GetFolderName(imageKind);
            var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var uploadFolder = Path.Combine(webRoot, "uploads", folderName);

            Directory.CreateDirectory(uploadFolder);

            var fileName = $"{Guid.NewGuid():N}{extension}";
            var newFilePath = Path.Combine(uploadFolder, fileName);
            var oldUrl = imageKind == ProfileImageKind.Avatar ? user.AvatarUrl : user.CoverUrl;

            try
            {
                await using (var stream = new FileStream(newFilePath, FileMode.CreateNew))
                {
                    await file.CopyToAsync(stream);
                }

                var newUrl = $"/uploads/{folderName}/{fileName}";

                if (imageKind == ProfileImageKind.Avatar)
                    user.AvatarUrl = newUrl;
                else
                    user.CoverUrl = newUrl;

                user.UpdatedAt = DateTimeOffset.UtcNow;

                var result = await _userManager.UpdateAsync(user);

                if (!result.Succeeded)
                    throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));
            }
            catch
            {
                DeleteFileIfExists(newFilePath);
                throw;
            }

            DeleteOwnedProfileImage(oldUrl, imageKind);
            return (await GetProfileAsync(userId, userId))!;
        }

        private async Task<UserProfileDto> DeleteProfileImageAsync(Guid userId, ProfileImageKind imageKind)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user is null)
                throw new InvalidOperationException("Không tìm thấy người dùng.");

            var oldUrl = imageKind == ProfileImageKind.Avatar ? user.AvatarUrl : user.CoverUrl;

            if (imageKind == ProfileImageKind.Avatar)
                user.AvatarUrl = null;
            else
                user.CoverUrl = null;

            user.UpdatedAt = DateTimeOffset.UtcNow;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));

            DeleteOwnedProfileImage(oldUrl, imageKind);
            return (await GetProfileAsync(userId, userId))!;
        }

        private static async Task<string> ValidateImageAsync(IFormFile file, long maxFileSize)
        {
            if (file.Length == 0)
                throw new InvalidOperationException("File ảnh không hợp lệ.");

            if (file.Length > maxFileSize)
                throw new InvalidOperationException($"File ảnh không được vượt quá {maxFileSize / (1024 * 1024)}MB.");

            var expectedExtension = file.ContentType.ToLowerInvariant() switch
            {
                "image/jpeg" or "image/jpg" => ".jpg",
                "image/png" => ".png",
                "image/webp" => ".webp",
                _ => throw new InvalidOperationException("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.")
            };

            var header = new byte[12];
            await using var stream = file.OpenReadStream();
            var bytesRead = await stream.ReadAsync(header.AsMemory(0, header.Length));

            var actualExtension = GetImageExtensionFromHeader(header, bytesRead);

            if (actualExtension != expectedExtension)
                throw new InvalidOperationException("Nội dung file không khớp với định dạng ảnh được khai báo.");

            return actualExtension;
        }

        private static string? GetImageExtensionFromHeader(byte[] header, int bytesRead)
        {
            if (bytesRead >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
                return ".jpg";

            if (bytesRead >= 8 && header.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }))
                return ".png";

            if (bytesRead >= 12 &&
                header.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
                header.AsSpan(8, 4).SequenceEqual("WEBP"u8))
            {
                return ".webp";
            }

            return null;
        }

        private void DeleteOwnedProfileImage(string? imageUrl, ProfileImageKind imageKind)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
                return;

            var folderName = GetFolderName(imageKind);
            var expectedPrefix = $"/uploads/{folderName}/";

            if (!imageUrl.StartsWith(expectedPrefix, StringComparison.Ordinal))
                return;

            var fileName = Path.GetFileName(imageUrl);

            if (string.IsNullOrWhiteSpace(fileName) || imageUrl != $"{expectedPrefix}{fileName}")
                return;

            var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var expectedFolder = Path.GetFullPath(Path.Combine(webRoot, "uploads", folderName));
            var fullPath = Path.GetFullPath(Path.Combine(expectedFolder, fileName));

            if (!fullPath.StartsWith(expectedFolder + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                return;

            DeleteFileIfExists(fullPath);
        }

        private static void DeleteFileIfExists(string filePath)
        {
            if (File.Exists(filePath))
                File.Delete(filePath);
        }

        private static string GetFolderName(ProfileImageKind imageKind)
        {
            return imageKind == ProfileImageKind.Avatar ? "avatars" : "covers";
        }

        private enum ProfileImageKind
        {
            Avatar,
            Cover
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
