using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.DTOs.Common;
using SocialSport.Api.DTOs.Group;
using SocialSport.Api.DTOs.Post;
using SocialSport.Api.DTOs.User;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Services.Interfaces;

namespace SocialSport.Api.Services.Implementations;

public class ExploreService : IExploreService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public ExploreService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<PagedResponse<PostDto>> GetPostsAsync(Guid userId, string? search, Guid? sportId, string? sort, int page, int pageSize)
    {
        (page, pageSize) = Normalize(page, pageSize);
        var blockedIds = BlockedUserIds(userId);
        var query = _context.Posts.AsNoTracking()
            .Include(x => x.Group).Include(x => x.Sport).Include(x => x.Media).Include(x => x.Comments).Include(x => x.Reactions)
            .Where(x => x.Status == PostStatus.Published && x.AuthorId != userId && !blockedIds.Contains(x.AuthorId))
            .Where(x => x.Visibility == PostVisibility.Public)
            .Where(x => x.GroupId == null || (x.Group != null && x.Group.Status == GroupStatus.Active && x.Group.Privacy == GroupPrivacy.Public));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var value = search.Trim();
            query = query.Where(x => (x.Content != null && x.Content.Contains(value)) || (x.Sport != null && x.Sport.Name.Contains(value)) || (x.Group != null && x.Group.Name.Contains(value)));
        }
        if (sportId.HasValue) query = query.Where(x => x.SportId == sportId.Value);

        var total = await query.CountAsync();
        query = NormalizeSort(sort) switch
        {
            "latest" => query.OrderByDescending(x => x.CreatedAt),
            _ => query.OrderByDescending(x => x.Reactions.Count * 2 + x.Comments.Count(c => c.Status == CommentStatus.Published)).ThenByDescending(x => x.CreatedAt)
        };
        var posts = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        var authorIds = posts.Select(x => x.AuthorId).Distinct().ToList();
        var authors = await _userManager.Users.Where(x => authorIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id);
        var savedIds = await _context.SavedPosts.Where(x => x.UserId == userId && posts.Select(p => p.Id).Contains(x.PostId)).Select(x => x.PostId).ToListAsync();

        return Page(posts.Select(post =>
        {
            authors.TryGetValue(post.AuthorId, out var author);
            return new PostDto
            {
                Id = post.Id, AuthorId = post.AuthorId, AuthorName = author?.DisplayName ?? string.Empty, AuthorAvatar = author?.AvatarUrl,
                GroupId = post.GroupId, GroupName = post.Group?.Name, SportId = post.SportId, SportName = post.Sport?.Name,
                Content = post.Content, Visibility = post.Visibility, LikeCount = post.Reactions.Count,
                CommentCount = post.Comments.Count(x => x.Status == CommentStatus.Published),
                CurrentReaction = post.Reactions.FirstOrDefault(x => x.UserId == userId)?.Type, IsSaved = savedIds.Contains(post.Id),
                CreatedAt = post.CreatedAt, UpdatedAt = post.UpdatedAt,
                Media = post.Media.OrderBy(x => x.SortOrder).Select(x => new PostMediaDto { Id = x.Id, Url = x.Url, MediaType = (int)x.MediaType, SortOrder = x.SortOrder }).ToList()
            };
        }).ToList(), page, pageSize, total);
    }

    public async Task<PagedResponse<GroupDto>> GetGroupsAsync(Guid userId, string? search, string? sort, int page, int pageSize)
    {
        (page, pageSize) = Normalize(page, pageSize);
        var query = _context.Groups.AsNoTracking().Include(x => x.Members)
            .Where(x => x.Status == GroupStatus.Active && x.Privacy == GroupPrivacy.Public)
            .Where(x => !x.Members.Any(m => m.UserId == userId && m.Status == GroupMemberStatus.Banned));
        if (!string.IsNullOrWhiteSpace(search)) { var value = search.Trim(); query = query.Where(x => x.Name.Contains(value) || (x.Description != null && x.Description.Contains(value))); }
        var total = await query.CountAsync();
        query = NormalizeSort(sort) == "latest" ? query.OrderByDescending(x => x.CreatedAt) : query.OrderByDescending(x => x.Members.Count(m => m.Status == GroupMemberStatus.Active)).ThenByDescending(x => x.CreatedAt);
        var groups = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        var ownerIds = groups.Select(x => x.OwnerId).Distinct().ToList();
        var owners = await _userManager.Users.Where(x => ownerIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id);
        return Page(groups.Select(group =>
        {
            owners.TryGetValue(group.OwnerId, out var owner);
            var member = group.Members.FirstOrDefault(x => x.UserId == userId);
            return new GroupDto { Id = group.Id, Name = group.Name, Slug = group.Slug, Description = group.Description, AvatarUrl = group.AvatarUrl, CoverUrl = group.CoverUrl, OwnerId = group.OwnerId, OwnerName = owner?.DisplayName ?? string.Empty, Privacy = group.Privacy, Status = group.Status, MemberCount = group.Members.Count(x => x.Status == GroupMemberStatus.Active), IsMember = member?.Status == GroupMemberStatus.Active, CurrentUserRole = member?.Status == GroupMemberStatus.Active ? member.Role : null, CurrentUserMemberStatus = member?.Status, CreatedAt = group.CreatedAt, UpdatedAt = group.UpdatedAt };
        }).ToList(), page, pageSize, total);
    }

    public async Task<PagedResponse<UserSummaryDto>> GetUsersAsync(Guid userId, string? search, string? sort, int page, int pageSize)
    {
        (page, pageSize) = Normalize(page, pageSize);
        var blockedIds = BlockedUserIds(userId);
        var query = _userManager.Users.AsNoTracking().Where(x => x.Status == UserStatus.Active && x.Id != userId && !blockedIds.Contains(x.Id));
        if (!string.IsNullOrWhiteSpace(search)) { var value = search.Trim(); query = query.Where(x => x.DisplayName.Contains(value) || (x.UserName != null && x.UserName.Contains(value))); }
        var total = await query.CountAsync();
        query = NormalizeSort(sort) == "latest" ? query.OrderByDescending(x => x.CreatedAt) : query.OrderByDescending(x => _context.Follows.Count(f => f.FollowingId == x.Id)).ThenByDescending(x => x.CreatedAt);
        var users = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Page(users.Select(x => new UserSummaryDto { Id = x.Id, UserName = x.UserName ?? string.Empty, DisplayName = x.DisplayName, AvatarUrl = x.AvatarUrl }).ToList(), page, pageSize, total);
    }

    private IQueryable<Guid> BlockedUserIds(Guid userId) => _context.UserBlocks.Where(x => x.BlockerId == userId).Select(x => x.BlockedId).Union(_context.UserBlocks.Where(x => x.BlockedId == userId).Select(x => x.BlockerId));
    private static string NormalizeSort(string? sort) => string.Equals(sort, "latest", StringComparison.OrdinalIgnoreCase) ? "latest" : "recommended";
    private static (int Page, int PageSize) Normalize(int page, int pageSize) => (Math.Max(1, page), Math.Clamp(pageSize, 1, 50));
    private static PagedResponse<T> Page<T>(List<T> items, int page, int pageSize, int total) => new() { Items = items, Page = page, PageSize = pageSize, Total = total };
}
