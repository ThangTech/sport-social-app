using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.DTOs.Group;
using SocialSport.Api.DTOs.Post;
using SocialSport.Api.Data;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;
using SocialSport.Api.Services.Interfaces;
using System.Globalization;
using System.Text;

namespace SocialSport.Api.Services.Implementations;

public class GroupService : IGroupService
{
    private const long MaxAvatarFileSize = 5 * 1024 * 1024;
    private const long MaxCoverFileSize = 10 * 1024 * 1024;

    private readonly IGroupRepository _groupRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IGroupMemberRepository _groupMemberRepository;
    private readonly IPostRepository _postRepository;
    private readonly ISavedPostRepository _savedPostRepository;
    private readonly IWebHostEnvironment _environment;
    private readonly INotificationService _notificationService;
    private readonly IMediaUrlService _mediaUrlService;
    private readonly ApplicationDbContext _context;

    public GroupService(
        IGroupRepository groupRepository,
        UserManager<ApplicationUser> userManager,
        IGroupMemberRepository groupMemberRepository,
        IPostRepository postRepository,
        ISavedPostRepository savedPostRepository,
        IWebHostEnvironment environment,
        INotificationService notificationService,
        IMediaUrlService mediaUrlService,
        ApplicationDbContext context)
    {
        _groupRepository = groupRepository;
        _userManager = userManager;
        _groupMemberRepository = groupMemberRepository;
        _postRepository = postRepository;
        _savedPostRepository = savedPostRepository;
        _environment = environment;
        _notificationService = notificationService;
        _mediaUrlService = mediaUrlService;
        _context = context;
    }

    public async Task<GroupDto> CreateAsync(Guid userId, CreateGroupRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());

        if (user is null)
            throw new KeyNotFoundException("Không tìm thấy người dùng.");

        var (name, description) = NormalizeAndValidateGroupInput(request.Name, request.Description, request.Privacy);
        var slug = await CreateUniqueSlugAsync(name);

        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = slug,
            Description = description,
            OwnerId = userId,
            Privacy = request.Privacy,
            Status = GroupStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        group.Members.Add(new GroupMember
        {
            GroupId = group.Id,
            UserId = userId,
            Role = GroupMemberRole.Admin,
            Status = GroupMemberStatus.Active,
            JoinedAt = DateTimeOffset.UtcNow
        });

        await _groupRepository.AddAsync(group);
        await _groupRepository.SaveChangesAsync();

        return new GroupDto
        {
            Id = group.Id,
            Name = group.Name,
            Slug = group.Slug,
            Description = group.Description,
            AvatarUrl = group.AvatarUrl,
            CoverUrl = group.CoverUrl,
            OwnerId = group.OwnerId,
            OwnerName = user.DisplayName,
            Privacy = group.Privacy,
            Status = group.Status,
            MemberCount = group.Members.Count(x => x.Status == GroupMemberStatus.Active),
            IsMember = true,
            CurrentUserRole = GroupMemberRole.Admin,
            CurrentUserMemberStatus = GroupMemberStatus.Active,
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt
        };
    }

    public async Task<GroupsResponse> GetAllAsync(
        Guid? currentUserId,
        string? search,
        int limit,
        string? cursor,
        GroupListScope scope)
    {
        limit = Math.Clamp(limit, 1, 50);
        search = string.IsNullOrWhiteSpace(search) ? null : search.Trim();

        if (search?.Length > 150)
            throw new InvalidOperationException("Từ khóa tìm kiếm không được vượt quá 150 ký tự.");

        if (!Enum.IsDefined(scope))
            throw new InvalidOperationException("Phạm vi danh sách nhóm không hợp lệ.");

        if (scope == GroupListScope.Joined && !currentUserId.HasValue)
            throw new UnauthorizedAccessException("Bạn cần đăng nhập để xem nhóm đã tham gia.");

        var (cursorCreatedAt, cursorGroupId) = DecodeGroupCursor(cursor);
        var groups = await _groupRepository.GetListAsync(
            search,
            limit,
            cursorCreatedAt,
            cursorGroupId,
            currentUserId,
            scope);
        var hasMore = groups.Count > limit;

        if (hasMore)
            groups = groups.Take(limit).ToList();

        var groupIds = groups.Select(x => x.Id).ToList();
        var ownerIds = groups.Select(x => x.OwnerId).Distinct().ToList();
        var owners = await _userManager.Users
            .Where(x => ownerIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id);
        var memberCounts = await _groupMemberRepository.GetActiveMemberCountsAsync(groupIds);
        var currentMemberships = currentUserId.HasValue
            ? (await _groupMemberRepository.GetByUserAndGroupsAsync(currentUserId.Value, groupIds))
                .ToDictionary(x => x.GroupId)
            : [];

        var items = groups.Select(group =>
        {
            owners.TryGetValue(group.OwnerId, out var owner);
            memberCounts.TryGetValue(group.Id, out var memberCount);
            currentMemberships.TryGetValue(group.Id, out var currentMembership);

            return new GroupDto
            {
                Id = group.Id,
                Name = group.Name,
                Slug = group.Slug,
                Description = group.Description,
                AvatarUrl = group.AvatarUrl,
                CoverUrl = group.CoverUrl,
                OwnerId = group.OwnerId,
                OwnerName = owner?.DisplayName ?? string.Empty,
                Privacy = group.Privacy,
                Status = group.Status,
                MemberCount = memberCount,
                IsMember = currentMembership?.Status == GroupMemberStatus.Active,
                CurrentUserRole = currentMembership?.Status == GroupMemberStatus.Active ? currentMembership.Role : null,
                CurrentUserMemberStatus = currentMembership?.Status,
                CreatedAt = group.CreatedAt,
                UpdatedAt = group.UpdatedAt
            };
        }).ToList();

        return new GroupsResponse
        {
            Items = items,
            NextCursor = hasMore && groups.Count > 0
                ? EncodeGroupCursor(groups[^1].CreatedAt, groups[^1].Id)
                : null
        };
    }

    private static (DateTimeOffset? CreatedAt, Guid? GroupId) DecodeGroupCursor(string? cursor)
    {
        if (string.IsNullOrWhiteSpace(cursor))
            return (null, null);

        try
        {
            var value = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
            var parts = value.Split('|', 2);

            if (parts.Length != 2 ||
                !DateTimeOffset.TryParseExact(parts[0], "O", CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var createdAt) ||
                !Guid.TryParseExact(parts[1], "D", out var groupId))
            {
                throw new InvalidOperationException("Cursor không hợp lệ.");
            }

            return (createdAt, groupId);
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("Cursor không hợp lệ.");
        }
    }

    private static string EncodeGroupCursor(DateTimeOffset createdAt, Guid groupId)
    {
        var value = $"{createdAt:O}|{groupId:D}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(value));
    }

    public async Task<GroupDto?> GetByIdAsync(Guid groupId, Guid? currentUserId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status == GroupStatus.Removed)
            return null;

        var owner = await _userManager.FindByIdAsync(group.OwnerId.ToString());

        GroupMember? currentMember = null;
        if (currentUserId.HasValue)
            currentMember = await _groupMemberRepository.GetAsync(groupId, currentUserId.Value);

        return new GroupDto
        {
            Id = group.Id,
            Name = group.Name,
            Slug = group.Slug,
            Description = group.Description,
            AvatarUrl = group.AvatarUrl,
            CoverUrl = group.CoverUrl,
            OwnerId = group.OwnerId,
            OwnerName = owner?.DisplayName ?? string.Empty,
            Privacy = group.Privacy,
            Status = group.Status,
            MemberCount = group.Members.Count(x => x.Status == GroupMemberStatus.Active),
            IsMember = currentMember?.Status == GroupMemberStatus.Active,
            CurrentUserRole = currentMember?.Status == GroupMemberStatus.Active ? currentMember.Role : null,
            CurrentUserMemberStatus = currentMember?.Status,
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt
        };
    }

    public async Task<GroupDto> UpdateAsync(Guid userId, Guid groupId, UpdateGroupRequest request)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status == GroupStatus.Removed)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        if (group.OwnerId != userId)
            throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa nhóm này.");

        var (name, description) = NormalizeAndValidateGroupInput(request.Name, request.Description, request.Privacy);

        group.Name = name;
        group.Description = description;
        group.Privacy = request.Privacy;
        group.UpdatedAt = DateTimeOffset.UtcNow;

        await _groupRepository.SaveChangesAsync();

        var owner = await _userManager.FindByIdAsync(group.OwnerId.ToString());
        var currentMember = group.Members.FirstOrDefault(x => x.UserId == userId && x.Status == GroupMemberStatus.Active);

        return new GroupDto
        {
            Id = group.Id,
            Name = group.Name,
            Slug = group.Slug,
            Description = group.Description,
            AvatarUrl = group.AvatarUrl,
            CoverUrl = group.CoverUrl,
            OwnerId = group.OwnerId,
            OwnerName = owner?.DisplayName ?? string.Empty,
            Privacy = group.Privacy,
            Status = group.Status,
            MemberCount = group.Members.Count(x => x.Status == GroupMemberStatus.Active),
            IsMember = currentMember is not null,
            CurrentUserRole = currentMember?.Role,
            CurrentUserMemberStatus = currentMember?.Status,
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt
        };
    }

    public Task<GroupDto> UpdateAvatarAsync(Guid userId, Guid groupId, IFormFile file)
    {
        return UpdateGroupImageAsync(userId, groupId, file, GroupImageKind.Avatar);
    }

    public Task<GroupDto> DeleteAvatarAsync(Guid userId, Guid groupId)
    {
        return DeleteGroupImageAsync(userId, groupId, GroupImageKind.Avatar);
    }

    public Task<GroupDto> UpdateCoverAsync(Guid userId, Guid groupId, IFormFile file)
    {
        return UpdateGroupImageAsync(userId, groupId, file, GroupImageKind.Cover);
    }

    public Task<GroupDto> DeleteCoverAsync(Guid userId, Guid groupId)
    {
        return DeleteGroupImageAsync(userId, groupId, GroupImageKind.Cover);
    }

    private async Task<GroupDto> UpdateGroupImageAsync(Guid userId, Guid groupId, IFormFile file, GroupImageKind imageKind)
    {
        var group = await GetActiveOwnedGroupAsync(userId, groupId);
        var maxFileSize = imageKind == GroupImageKind.Avatar ? MaxAvatarFileSize : MaxCoverFileSize;
        var extension = await ValidateImageAsync(file, maxFileSize);
        var folderName = GetImageFolderName(imageKind);
        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var uploadFolder = Path.Combine(webRoot, "uploads", "groups", folderName);

        Directory.CreateDirectory(uploadFolder);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var newFilePath = Path.Combine(uploadFolder, fileName);
        var oldUrl = imageKind == GroupImageKind.Avatar ? group.AvatarUrl : group.CoverUrl;

        try
        {
            await using (var stream = new FileStream(newFilePath, FileMode.CreateNew))
            {
                await file.CopyToAsync(stream);
            }

            var newUrl = $"/uploads/groups/{folderName}/{fileName}";

            if (imageKind == GroupImageKind.Avatar)
                group.AvatarUrl = newUrl;
            else
                group.CoverUrl = newUrl;

            group.UpdatedAt = DateTimeOffset.UtcNow;
            await _groupRepository.SaveChangesAsync();
        }
        catch
        {
            DeleteFileIfExists(newFilePath);
            throw;
        }

        DeleteOwnedGroupImage(oldUrl, imageKind);
        return (await GetByIdAsync(groupId, userId))!;
    }

    private async Task<GroupDto> DeleteGroupImageAsync(Guid userId, Guid groupId, GroupImageKind imageKind)
    {
        var group = await GetActiveOwnedGroupAsync(userId, groupId);
        var oldUrl = imageKind == GroupImageKind.Avatar ? group.AvatarUrl : group.CoverUrl;

        if (imageKind == GroupImageKind.Avatar)
            group.AvatarUrl = null;
        else
            group.CoverUrl = null;

        group.UpdatedAt = DateTimeOffset.UtcNow;
        await _groupRepository.SaveChangesAsync();

        DeleteOwnedGroupImage(oldUrl, imageKind);
        return (await GetByIdAsync(groupId, userId))!;
    }

    private async Task<Group> GetActiveOwnedGroupAsync(Guid userId, Guid groupId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        if (group.OwnerId != userId)
            throw new UnauthorizedAccessException("Chỉ chủ nhóm mới có quyền thay đổi ảnh của nhóm.");

        return group;
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

    private void DeleteOwnedGroupImage(string? imageUrl, GroupImageKind imageKind)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
            return;

        var folderName = GetImageFolderName(imageKind);
        var expectedPrefix = $"/uploads/groups/{folderName}/";

        if (!imageUrl.StartsWith(expectedPrefix, StringComparison.Ordinal))
            return;

        var fileName = Path.GetFileName(imageUrl);

        if (string.IsNullOrWhiteSpace(fileName) || imageUrl != $"{expectedPrefix}{fileName}")
            return;

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var expectedFolder = Path.GetFullPath(Path.Combine(webRoot, "uploads", "groups", folderName));
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

    private static string GetImageFolderName(GroupImageKind imageKind)
    {
        return imageKind == GroupImageKind.Avatar ? "avatars" : "covers";
    }

    private enum GroupImageKind
    {
        Avatar,
        Cover
    }

    public async Task DeleteAsync(Guid userId, Guid groupId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status == GroupStatus.Removed)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        if (group.OwnerId != userId)
            throw new UnauthorizedAccessException("Bạn không có quyền xóa nhóm này.");

        group.Status = GroupStatus.Removed;
        group.DeletedAt = DateTimeOffset.UtcNow;

        await _groupRepository.SaveChangesAsync();
    }

    private static (string Name, string? Description) NormalizeAndValidateGroupInput(
        string name,
        string? description,
        GroupPrivacy privacy)
    {
        var normalizedName = name.Trim();
        var normalizedDescription = description?.Trim();

        if (normalizedName.Length is < 3 or > 100)
            throw new InvalidOperationException("Tên nhóm phải từ 3 đến 100 ký tự.");

        if (normalizedDescription?.Length > 1000)
            throw new InvalidOperationException("Mô tả nhóm không được vượt quá 1000 ký tự.");

        if (!Enum.IsDefined(typeof(GroupPrivacy), privacy))
            throw new InvalidOperationException("Quyền riêng tư của nhóm không hợp lệ.");

        return (normalizedName, normalizedDescription);
    }

    private async Task<string> CreateUniqueSlugAsync(string name)
    {
        var slug = CreateSlug(name);
        var result = slug;

        while (await _groupRepository.SlugExistsAsync(result))
            result = $"{slug}-{Guid.NewGuid().ToString("N")[..6]}";

        return result;
    }

    private static string CreateSlug(string value)
    {
        value = value.Trim().ToLowerInvariant().Replace("đ", "d");

        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();

        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                builder.Append(c);
        }

        var slug = builder.ToString().Normalize(NormalizationForm.FormC);
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9]+", "-").Trim('-');

        return string.IsNullOrWhiteSpace(slug) ? "group" : slug;
    }
    public async Task<GroupMemberDto> JoinAsync(Guid userId, Guid groupId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        var user = await _userManager.FindByIdAsync(userId.ToString());

        if (user is null)
            throw new KeyNotFoundException("Không tìm thấy người dùng.");

        var existingMember = await _groupMemberRepository.GetAsync(groupId, userId);

        if (existingMember is not null)
        {
            if (existingMember.Status == GroupMemberStatus.Banned)
                throw new InvalidOperationException("Bạn đã bị cấm khỏi nhóm.");

            return new GroupMemberDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                DisplayName = user.DisplayName,
                AvatarUrl = user.AvatarUrl,
                Role = existingMember.Role,
                Status = existingMember.Status,
                JoinedAt = existingMember.JoinedAt
            };
        }

        var member = new GroupMember
        {
            GroupId = groupId,
            UserId = userId,
            Role = GroupMemberRole.Member,
            Status = group.Privacy == GroupPrivacy.Public ? GroupMemberStatus.Active : GroupMemberStatus.Pending,
            JoinedAt = DateTimeOffset.UtcNow
        };

        await _groupMemberRepository.AddAsync(member);
        await _groupMemberRepository.SaveChangesAsync();

        return new GroupMemberDto
        {
            UserId = user.Id,
            UserName = user.UserName ?? string.Empty,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            Role = member.Role,
            Status = member.Status,
            JoinedAt = member.JoinedAt
        };
    }
    public async Task LeaveAsync(Guid userId, Guid groupId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        if (group.OwnerId == userId)
            throw new InvalidOperationException("Chủ nhóm không thể rời nhóm.");

        var member = await _groupMemberRepository.GetAsync(groupId, userId);

        if (member is null)
            return;

        if (member.Status == GroupMemberStatus.Banned)
            throw new InvalidOperationException("Bạn đang bị cấm khỏi nhóm.");

        _groupMemberRepository.Remove(member);
        await _groupMemberRepository.SaveChangesAsync();
    }
    public async Task<List<GroupMemberDto>> GetMembersAsync(Guid? currentUserId, Guid groupId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        GroupMember? currentMember = null;

        if (currentUserId.HasValue)
            currentMember = await _groupMemberRepository.GetAsync(groupId, currentUserId.Value);

        if (currentMember?.Status == GroupMemberStatus.Banned)
            throw new UnauthorizedAccessException("Bạn đã bị cấm khỏi nhóm.");

        if (group.Privacy == GroupPrivacy.Private && (currentMember is null || currentMember.Status != GroupMemberStatus.Active))
            throw new UnauthorizedAccessException("Bạn phải là thành viên để xem danh sách thành viên.");

        var members = await _groupMemberRepository.GetByGroupAsync(groupId, GroupMemberStatus.Active);
        var userIds = members.Select(x => x.UserId).ToList();

        var users = await _userManager.Users
            .Where(x => userIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id);

        return members.Select(member =>
        {
            users.TryGetValue(member.UserId, out var user);

            return new GroupMemberDto
            {
                UserId = member.UserId,
                UserName = user?.UserName ?? string.Empty,
                DisplayName = user?.DisplayName ?? string.Empty,
                AvatarUrl = user?.AvatarUrl,
                Role = member.Role,
                Status = member.Status,
                JoinedAt = member.JoinedAt
            };
        }).ToList();
    }
    public async Task<List<GroupMemberDto>> GetJoinRequestsAsync(Guid userId, Guid groupId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        var currentMember = await _groupMemberRepository.GetAsync(groupId, userId);

        if (currentMember is null || currentMember.Status != GroupMemberStatus.Active || currentMember.Role != GroupMemberRole.Admin)
            throw new UnauthorizedAccessException("Bạn không có quyền xem yêu cầu tham gia.");

        var requests = await _groupMemberRepository.GetByGroupAsync(groupId, GroupMemberStatus.Pending);
        var userIds = requests.Select(x => x.UserId).ToList();

        var users = await _userManager.Users
            .Where(x => userIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id);

        return requests.Select(member =>
        {
            users.TryGetValue(member.UserId, out var user);

            return new GroupMemberDto
            {
                UserId = member.UserId,
                UserName = user?.UserName ?? string.Empty,
                DisplayName = user?.DisplayName ?? string.Empty,
                AvatarUrl = user?.AvatarUrl,
                Role = member.Role,
                Status = member.Status,
                JoinedAt = member.JoinedAt
            };
        }).ToList();
    }
    public async Task ApproveMemberAsync(Guid userId, Guid groupId, Guid targetUserId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        var currentMember = await _groupMemberRepository.GetAsync(groupId, userId);

        if (currentMember is null || currentMember.Status != GroupMemberStatus.Active || currentMember.Role != GroupMemberRole.Admin)
            throw new UnauthorizedAccessException("Bạn không có quyền duyệt thành viên.");

        var targetMember = await _groupMemberRepository.GetAsync(groupId, targetUserId);

        if (targetMember is null || targetMember.Status != GroupMemberStatus.Pending)
            throw new KeyNotFoundException("Không tìm thấy yêu cầu tham gia.");

        targetMember.Status = GroupMemberStatus.Active;
        targetMember.JoinedAt = DateTimeOffset.UtcNow;

        await _groupMemberRepository.SaveChangesAsync();
        await _notificationService.CreateAsync(targetUserId, userId, NotificationType.GroupJoinApproved, groupId);
    }
    public async Task RejectMemberAsync(Guid userId, Guid groupId, Guid targetUserId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        var currentMember = await _groupMemberRepository.GetAsync(groupId, userId);

        if (currentMember is null || currentMember.Status != GroupMemberStatus.Active || currentMember.Role != GroupMemberRole.Admin)
            throw new UnauthorizedAccessException("Bạn không có quyền từ chối yêu cầu tham gia.");

        var targetMember = await _groupMemberRepository.GetAsync(groupId, targetUserId);

        if (targetMember is null || targetMember.Status != GroupMemberStatus.Pending)
            throw new KeyNotFoundException("Không tìm thấy yêu cầu tham gia.");

        _groupMemberRepository.Remove(targetMember);
        await _groupMemberRepository.SaveChangesAsync();
        await _notificationService.CreateAsync(targetUserId, userId, NotificationType.GroupJoinRejected, groupId);
    }
    public async Task UpdateMemberRoleAsync(Guid userId, Guid groupId, Guid targetUserId, UpdateGroupMemberRoleRequest request)
    {
        if (!Enum.IsDefined(typeof(GroupMemberRole), request.Role))
            throw new InvalidOperationException("Vai trò không hợp lệ.");

        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        var currentMember = await _groupMemberRepository.GetAsync(groupId, userId);

        if (currentMember is null || currentMember.Status != GroupMemberStatus.Active || currentMember.Role != GroupMemberRole.Admin)
            throw new UnauthorizedAccessException("Bạn không có quyền thay đổi vai trò thành viên.");

        var targetMember = await _groupMemberRepository.GetAsync(groupId, targetUserId);

        if (targetMember is null || targetMember.Status != GroupMemberStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy thành viên.");

        if (targetUserId == group.OwnerId)
            throw new InvalidOperationException("Không thể thay đổi vai trò của chủ nhóm.");

        if (targetUserId == userId)
            throw new InvalidOperationException("Bạn không thể tự thay đổi vai trò của mình.");

        var isOwner = group.OwnerId == userId;

        if (!isOwner)
        {
            if (targetMember.Role == GroupMemberRole.Admin)
                throw new UnauthorizedAccessException("Admin không thể thay đổi quyền của Admin khác.");

            if (request.Role == GroupMemberRole.Admin)
                throw new UnauthorizedAccessException("Chỉ chủ nhóm mới có thể cấp quyền Admin.");
        }

        targetMember.Role = request.Role;

        await _groupMemberRepository.SaveChangesAsync();
    }
    public async Task RemoveMemberAsync(Guid userId, Guid groupId, Guid targetUserId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        if (targetUserId == group.OwnerId)
            throw new InvalidOperationException("Không thể xóa chủ nhóm khỏi nhóm.");

        if (targetUserId == userId)
            throw new InvalidOperationException("Hãy sử dụng chức năng rời nhóm để rời khỏi nhóm.");

        var currentMember = await _groupMemberRepository.GetAsync(groupId, userId);

        if (currentMember is null || currentMember.Status != GroupMemberStatus.Active)
            throw new UnauthorizedAccessException("Bạn không có quyền quản lý thành viên.");

        var targetMember = await _groupMemberRepository.GetAsync(groupId, targetUserId);

        if (targetMember is null || targetMember.Status != GroupMemberStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy thành viên.");

        var isOwner = group.OwnerId == userId;

        if (!isOwner)
        {
            if (currentMember.Role == GroupMemberRole.Member)
                throw new UnauthorizedAccessException("Bạn không có quyền xóa thành viên.");

            if (currentMember.Role == GroupMemberRole.Moderator && targetMember.Role != GroupMemberRole.Member)
                throw new UnauthorizedAccessException("Moderator chỉ có thể xóa Member.");

            if (currentMember.Role == GroupMemberRole.Admin && targetMember.Role == GroupMemberRole.Admin)
                throw new UnauthorizedAccessException("Admin không thể xóa Admin khác.");
        }

        _groupMemberRepository.Remove(targetMember);
        await _groupMemberRepository.SaveChangesAsync();
    }
    public async Task BanMemberAsync(Guid userId, Guid groupId, Guid targetUserId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        if (targetUserId == group.OwnerId)
            throw new InvalidOperationException("Không thể cấm chủ nhóm.");

        if (targetUserId == userId)
            throw new InvalidOperationException("Bạn không thể tự cấm chính mình.");

        var currentMember = await _groupMemberRepository.GetAsync(groupId, userId);

        if (currentMember is null || currentMember.Status != GroupMemberStatus.Active)
            throw new UnauthorizedAccessException("Bạn không có quyền quản lý thành viên.");

        var targetMember = await _groupMemberRepository.GetAsync(groupId, targetUserId);

        if (targetMember is null || targetMember.Status != GroupMemberStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy thành viên.");

        var isOwner = group.OwnerId == userId;

        if (!isOwner)
        {
            if (currentMember.Role == GroupMemberRole.Member)
                throw new UnauthorizedAccessException("Bạn không có quyền cấm thành viên.");

            if (currentMember.Role == GroupMemberRole.Moderator && targetMember.Role != GroupMemberRole.Member)
                throw new UnauthorizedAccessException("Moderator chỉ có thể cấm Member.");

            if (currentMember.Role == GroupMemberRole.Admin && targetMember.Role == GroupMemberRole.Admin)
                throw new UnauthorizedAccessException("Admin không thể cấm Admin khác.");
        }

        targetMember.Status = GroupMemberStatus.Banned;
        targetMember.Role = GroupMemberRole.Member;

        await _groupMemberRepository.SaveChangesAsync();
    }

    public async Task<List<GroupMemberDto>> GetBannedMembersAsync(Guid userId, Guid groupId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        var currentMember = await _groupMemberRepository.GetAsync(groupId, userId);

        if (currentMember is null || currentMember.Status != GroupMemberStatus.Active || currentMember.Role != GroupMemberRole.Admin)
            throw new UnauthorizedAccessException("Bạn không có quyền xem danh sách thành viên bị cấm.");

        var bannedMembers = await _groupMemberRepository.GetByGroupAsync(groupId, GroupMemberStatus.Banned);
        var userIds = bannedMembers.Select(x => x.UserId).ToList();

        var users = await _userManager.Users
            .Where(x => userIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id);

        return bannedMembers.Select(member =>
        {
            users.TryGetValue(member.UserId, out var user);

            return new GroupMemberDto
            {
                UserId = member.UserId,
                UserName = user?.UserName ?? string.Empty,
                DisplayName = user?.DisplayName ?? string.Empty,
                AvatarUrl = user?.AvatarUrl,
                Role = member.Role,
                Status = member.Status,
                JoinedAt = member.JoinedAt
            };
        }).ToList();
    }
    public async Task UnbanMemberAsync(Guid userId, Guid groupId, Guid targetUserId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        var currentMember = await _groupMemberRepository.GetAsync(groupId, userId);

        if (currentMember is null || currentMember.Status != GroupMemberStatus.Active || currentMember.Role != GroupMemberRole.Admin)
            throw new UnauthorizedAccessException("Bạn không có quyền bỏ cấm thành viên.");

        var targetMember = await _groupMemberRepository.GetAsync(groupId, targetUserId);

        if (targetMember is null || targetMember.Status != GroupMemberStatus.Banned)
            throw new KeyNotFoundException("Không tìm thấy thành viên bị cấm.");

        _groupMemberRepository.Remove(targetMember);
        await _groupMemberRepository.SaveChangesAsync();
    }
    public async Task<PostDto> CreatePostAsync(Guid userId, Guid groupId, CreateGroupPostRequest request)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        var member = await _groupMemberRepository.GetAsync(groupId, userId);

        if (member is null || member.Status != GroupMemberStatus.Active)
            throw new UnauthorizedAccessException("Bạn phải là thành viên của nhóm để đăng bài.");

        if (request.SportId.HasValue && !await _postRepository.SportExistsAsync(request.SportId.Value))
            throw new KeyNotFoundException("Không tìm thấy môn thể thao.");

        var canPublishImmediately = group.OwnerId == userId
            || member.Role is GroupMemberRole.Admin
                or GroupMemberRole.Moderator;

        var post = new Post
        {
            Id = Guid.NewGuid(),
            AuthorId = userId,
            GroupId = groupId,
            SportId = request.SportId,
            Content = request.Content.Trim(),
            Visibility = PostVisibility.Public,
            Status = canPublishImmediately
                ? PostStatus.Published
                : PostStatus.Hidden,
            GroupModerationStatus = canPublishImmediately
                ? GroupPostModerationStatus.Approved
                : GroupPostModerationStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await _postRepository.AddAsync(post);
        await _postRepository.SaveChangesAsync();

        if (!canPublishImmediately)
        {
            await _notificationService.CreateAsync(
                userId,
                null,
                NotificationType.GroupPostReviewPending,
                post.Id);
        }

        var createdPost = await _postRepository.GetByIdAsync(post.Id);
        var author = await _userManager.FindByIdAsync(userId.ToString());

        return new PostDto
        {
            Id = createdPost!.Id,
            AuthorId = createdPost.AuthorId,
            AuthorName = author?.DisplayName ?? string.Empty,
            AuthorAvatar = author?.AvatarUrl,
            GroupId = createdPost.GroupId,
            GroupName = createdPost.Group?.Name,
            SportId = createdPost.SportId,
            SportName = createdPost.Sport?.Name,
            Content = createdPost.Content,
            Visibility = createdPost.Visibility,
            GroupModerationStatus = createdPost.GroupModerationStatus,
            LikeCount = createdPost.Reactions.Count,
            CommentCount = createdPost.Comments.Count(x => x.Status == CommentStatus.Published),
            CurrentReaction = null,
            IsSaved = false,
            CreatedAt = createdPost.CreatedAt,
            UpdatedAt = createdPost.UpdatedAt,
            Media = createdPost.Media.OrderBy(x => x.SortOrder).Select(x => new PostMediaDto
            {
                Id = x.Id,
                Url = _mediaUrlService.CreatePostMediaUrl(x.Id),
                MediaType = (int)x.MediaType,
                SortOrder = x.SortOrder
            }).ToList()
        };
    }

    public async Task<List<PostDto>> GetPendingPostsAsync(
        Guid userId,
        Guid groupId)
    {
        await EnsureCanModeratePostsAsync(userId, groupId);

        var posts = await _context.Posts
            .AsNoTracking()
            .Include(x => x.Group)
            .Include(x => x.Sport)
            .Include(x => x.Media)
            .Include(x => x.Reactions)
            .Include(x => x.Comments)
            .Where(x =>
                x.GroupId == groupId
                && x.GroupModerationStatus
                    == GroupPostModerationStatus.Pending)
            .OrderBy(x => x.CreatedAt)
            .Take(50)
            .ToListAsync();
        var authorIds = posts
            .Select(x => x.AuthorId)
            .Distinct()
            .ToList();
        var users = await _userManager.Users
            .Where(x => authorIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id);

        return posts.Select(post =>
        {
            users.TryGetValue(post.AuthorId, out var author);
            return ToPostDto(post, author);
        }).ToList();
    }

    public async Task ApprovePostAsync(
        Guid userId,
        Guid groupId,
        Guid postId)
    {
        await EnsureCanModeratePostsAsync(userId, groupId);
        var post = await _context.Posts
            .Include(x => x.Media)
            .FirstOrDefaultAsync(x =>
                x.Id == postId
                && x.GroupId == groupId
                && x.GroupModerationStatus
                    == GroupPostModerationStatus.Pending)
            ?? throw new KeyNotFoundException(
                "Không tìm thấy bài viết đang chờ duyệt.");
        var mediaIds = post.Media.Select(x => x.Id).ToList();
        var hasBlockingCase = await _context.CopyrightCases.AnyAsync(x =>
            mediaIds.Contains(x.PostMediaId)
            && x.Status != CopyrightCaseStatus.Dismissed
            && x.Status != CopyrightCaseStatus.AppealAccepted);
        var hasBlockingScan = await _context.ExternalCopyrightScans.AnyAsync(x =>
            mediaIds.Contains(x.PostMediaId)
            && x.Status != ExternalCopyrightScanStatus.Clear
            && x.Status != ExternalCopyrightScanStatus.ClearedByAdmin
            && x.Status != ExternalCopyrightScanStatus.AppealAccepted);

        post.GroupModerationStatus = GroupPostModerationStatus.Approved;
        post.Status = hasBlockingCase || hasBlockingScan
            ? PostStatus.Hidden
            : PostStatus.Published;
        post.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();
        await _notificationService.CreateAsync(
            post.AuthorId,
            userId,
            NotificationType.GroupPostApproved,
            post.Id);
    }

    public async Task RejectPostAsync(
        Guid userId,
        Guid groupId,
        Guid postId)
    {
        await EnsureCanModeratePostsAsync(userId, groupId);
        var post = await _context.Posts.FirstOrDefaultAsync(x =>
            x.Id == postId
            && x.GroupId == groupId
            && x.GroupModerationStatus == GroupPostModerationStatus.Pending)
            ?? throw new KeyNotFoundException(
                "Không tìm thấy bài viết đang chờ duyệt.");

        post.GroupModerationStatus = GroupPostModerationStatus.Rejected;
        post.Status = PostStatus.Removed;
        post.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();
        await _notificationService.CreateAsync(
            post.AuthorId,
            userId,
            NotificationType.GroupPostRejected,
            post.Id);
    }

    private async Task EnsureCanModeratePostsAsync(
        Guid userId,
        Guid groupId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);
        if (group is null || group.Status != GroupStatus.Active)
        {
            throw new KeyNotFoundException("Không tìm thấy nhóm.");
        }

        var member = await _groupMemberRepository.GetAsync(groupId, userId);
        var canModerate = member?.Status == GroupMemberStatus.Active
            && (group.OwnerId == userId
                || member.Role is GroupMemberRole.Admin
                    or GroupMemberRole.Moderator);
        if (!canModerate)
        {
            throw new UnauthorizedAccessException(
                "Bạn không có quyền duyệt bài viết trong nhóm.");
        }
    }

    private PostDto ToPostDto(Post post, ApplicationUser? author)
    {
        return new PostDto
        {
            Id = post.Id,
            AuthorId = post.AuthorId,
            AuthorName = author?.DisplayName ?? string.Empty,
            AuthorAvatar = author?.AvatarUrl,
            GroupId = post.GroupId,
            GroupName = post.Group?.Name,
            SportId = post.SportId,
            SportName = post.Sport?.Name,
            Content = post.Content,
            Visibility = post.Visibility,
            GroupModerationStatus = post.GroupModerationStatus,
            LikeCount = post.Reactions.Count,
            CommentCount = post.Comments.Count(x =>
                x.Status == CommentStatus.Published),
            CurrentReaction = null,
            IsSaved = false,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            Media = post.Media
                .OrderBy(x => x.SortOrder)
                .Select(x => new PostMediaDto
                {
                    Id = x.Id,
                    Url = _mediaUrlService.CreatePostMediaUrl(x.Id),
                    MediaType = (int)x.MediaType,
                    SortOrder = x.SortOrder
                })
                .ToList()
        };
    }
    public async Task<GroupPostsResponse> GetPostsAsync(Guid? userId, Guid groupId, int limit, string? cursor)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        GroupMember? member = null;

        if (userId.HasValue)
            member = await _groupMemberRepository.GetAsync(groupId, userId.Value);

        if (member?.Status == GroupMemberStatus.Banned)
            throw new UnauthorizedAccessException("Bạn đã bị cấm khỏi nhóm.");

        if (group.Privacy == GroupPrivacy.Private && (member is null || member.Status != GroupMemberStatus.Active))
            throw new UnauthorizedAccessException("Bạn phải là thành viên để xem bài viết của nhóm riêng tư.");

        limit = Math.Clamp(limit, 1, 50);

        var (cursorCreatedAt, cursorPostId) = DecodeGroupPostCursor(cursor);
        var posts = await _postRepository.GetGroupPostsAsync(groupId, limit, cursorCreatedAt, cursorPostId);
        var hasMore = posts.Count > limit;

        if (hasMore)
            posts = posts.Take(limit).ToList();

        var authorIds = posts.Select(x => x.AuthorId).Distinct().ToList();
        var savedPostIds = userId.HasValue
            ? await _savedPostRepository.GetSavedPostIdsAsync(userId.Value, posts.Select(x => x.Id))
            : [];

        var users = await _userManager.Users
            .Where(x => authorIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id);

        var items = posts.Select(post =>
        {
            users.TryGetValue(post.AuthorId, out var author);

            return new PostDto
            {
                Id = post.Id,
                AuthorId = post.AuthorId,
                AuthorName = author?.DisplayName ?? string.Empty,
                AuthorAvatar = author?.AvatarUrl,
                GroupId = post.GroupId,
                GroupName = post.Group?.Name,
                SportId = post.SportId,
                SportName = post.Sport?.Name,
                Content = post.Content,
                Visibility = post.Visibility,
                LikeCount = post.Reactions.Count,
                CommentCount = post.Comments.Count(x => x.Status == CommentStatus.Published),
                CurrentReaction = userId.HasValue
                    ? post.Reactions.FirstOrDefault(x => x.UserId == userId.Value)?.Type
                    : null,
                IsSaved = savedPostIds.Contains(post.Id),
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                Media = post.Media.OrderBy(x => x.SortOrder).Select(x => new PostMediaDto
                {
                    Id = x.Id,
                    Url = _mediaUrlService.CreatePostMediaUrl(x.Id),
                    MediaType = (int)x.MediaType,
                    SortOrder = x.SortOrder
                }).ToList()
            };
        }).ToList();

        return new GroupPostsResponse
        {
            Items = items,
            NextCursor = hasMore && posts.Count > 0
                ? EncodeGroupPostCursor(posts[^1].CreatedAt, posts[^1].Id)
                : null
        };
    }

    private static (DateTimeOffset? CreatedAt, Guid? PostId) DecodeGroupPostCursor(string? cursor)
    {
        if (string.IsNullOrWhiteSpace(cursor))
            return (null, null);

        try
        {
            var value = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
            var parts = value.Split('|', 2);

            if (parts.Length != 2 ||
                !DateTimeOffset.TryParseExact(parts[0], "O", CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var createdAt) ||
                !Guid.TryParseExact(parts[1], "D", out var postId))
            {
                throw new InvalidOperationException("Cursor không hợp lệ.");
            }

            return (createdAt, postId);
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("Cursor không hợp lệ.");
        }
    }

    private static string EncodeGroupPostCursor(DateTimeOffset createdAt, Guid postId)
    {
        var value = $"{createdAt:O}|{postId:D}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(value));
    }
    public async Task RemovePostAsync(Guid userId, Guid groupId, Guid postId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        var post = await _postRepository.GetByIdAsync(postId);

        if (post is null || post.Status != PostStatus.Published || post.GroupId != groupId)
            throw new KeyNotFoundException("Không tìm thấy bài viết trong nhóm.");

        var currentMember = await _groupMemberRepository.GetAsync(groupId, userId);

        if (currentMember is null || currentMember.Status != GroupMemberStatus.Active)
            throw new UnauthorizedAccessException("Bạn không có quyền quản lý bài viết trong nhóm.");

        var isOwner = group.OwnerId == userId;

        if (!isOwner && currentMember.Role != GroupMemberRole.Admin && currentMember.Role != GroupMemberRole.Moderator)
            throw new UnauthorizedAccessException("Bạn không có quyền gỡ bài viết.");

        if (post.AuthorId == group.OwnerId && !isOwner)
            throw new UnauthorizedAccessException("Không thể gỡ bài viết của chủ nhóm.");

        if (!isOwner)
        {
            var authorMember = await _groupMemberRepository.GetAsync(groupId, post.AuthorId);

            if (currentMember.Role == GroupMemberRole.Moderator && authorMember is not null && authorMember.Role != GroupMemberRole.Member)
                throw new UnauthorizedAccessException("Moderator chỉ có thể gỡ bài viết của Member.");

            if (currentMember.Role == GroupMemberRole.Admin && authorMember is not null && authorMember.Role == GroupMemberRole.Admin)
                throw new UnauthorizedAccessException("Admin không thể gỡ bài viết của Admin khác.");
        }

        post.Status = PostStatus.Removed;
        post.UpdatedAt = DateTimeOffset.UtcNow;

        await _postRepository.SaveChangesAsync();
    }
}
