using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.DTOs.Group;
using SocialSport.Api.DTOs.Post;
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
    private readonly IGroupRepository _groupRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IGroupMemberRepository _groupMemberRepository;
    private readonly IPostRepository _postRepository;

    public GroupService(IGroupRepository groupRepository, UserManager<ApplicationUser> userManager, IGroupMemberRepository groupMemberRepository, IPostRepository postRepository)
    {
        _groupRepository = groupRepository;
        _userManager = userManager;
        _groupMemberRepository = groupMemberRepository;
        _postRepository = postRepository;
    }

    public async Task<GroupDto> CreateAsync(Guid userId, CreateGroupRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());

        if (user is null)
            throw new KeyNotFoundException("Không tìm thấy người dùng.");

        var slug = await CreateUniqueSlugAsync(request.Name);

        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Slug = slug,
            Description = request.Description?.Trim(),
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
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt
        };
    }

    public async Task<GroupDto?> GetByIdAsync(Guid groupId, Guid? currentUserId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status == GroupStatus.Removed)
            return null;

        var owner = await _userManager.FindByIdAsync(group.OwnerId.ToString());

        GroupMember? currentMember = null;
        if (currentUserId.HasValue)
        {
            currentMember = await _groupMemberRepository.GetAsync(groupId, currentUserId.Value);

            if (currentMember?.Status == GroupMemberStatus.Banned)
                throw new UnauthorizedAccessException("Bạn đã bị cấm khỏi nhóm.");
        }

        if (currentUserId.HasValue)
            currentMember = group.Members.FirstOrDefault(x => x.UserId == currentUserId.Value && x.Status == GroupMemberStatus.Active);

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

        group.Name = request.Name.Trim();
        group.Description = request.Description?.Trim();
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
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt
        };
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
    public async Task<List<GroupMemberDto>> GetMembersAsync(Guid groupId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status != GroupStatus.Active)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

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

        var post = new Post
        {
            Id = Guid.NewGuid(),
            AuthorId = userId,
            GroupId = groupId,
            SportId = request.SportId,
            Content = request.Content.Trim(),
            Visibility = request.Visibility,
            Status = PostStatus.Published,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await _postRepository.AddAsync(post);
        await _postRepository.SaveChangesAsync();

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
            LikeCount = createdPost.Reactions.Count,
            CommentCount = createdPost.Comments.Count(x => x.Status == CommentStatus.Published),
            CreatedAt = createdPost.CreatedAt,
            UpdatedAt = createdPost.UpdatedAt,
            Media = createdPost.Media.OrderBy(x => x.SortOrder).Select(x => new PostMediaDto
            {
                Id = x.Id,
                Url = x.Url,
                MediaType = (int)x.MediaType,
                SortOrder = x.SortOrder
            }).ToList()
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

        DateTimeOffset? cursorDate = null;

        if (!string.IsNullOrWhiteSpace(cursor))
        {
            try
            {
                var value = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));

                if (!DateTimeOffset.TryParse(value, out var parsedCursor))
                    throw new InvalidOperationException("Cursor không hợp lệ.");

                cursorDate = parsedCursor;
            }
            catch (FormatException)
            {
                throw new InvalidOperationException("Cursor không hợp lệ.");
            }
        }

        var posts = await _postRepository.GetGroupPostsAsync(groupId, limit, cursorDate);
        var hasMore = posts.Count > limit;

        if (hasMore)
            posts = posts.Take(limit).ToList();

        var authorIds = posts.Select(x => x.AuthorId).Distinct().ToList();

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
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                Media = post.Media.OrderBy(x => x.SortOrder).Select(x => new PostMediaDto
                {
                    Id = x.Id,
                    Url = x.Url,
                    MediaType = (int)x.MediaType,
                    SortOrder = x.SortOrder
                }).ToList()
            };
        }).ToList();

        string? nextCursor = null;

        if (hasMore && posts.Count > 0)
        {
            var value = posts[posts.Count - 1].CreatedAt.ToString("O");
            nextCursor = Convert.ToBase64String(Encoding.UTF8.GetBytes(value));
        }

        return new GroupPostsResponse
        {
            Items = items,
            NextCursor = nextCursor
        };
    }
}