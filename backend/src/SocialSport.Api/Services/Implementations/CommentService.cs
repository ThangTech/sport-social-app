using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.DTOs.Comment;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;
using SocialSport.Api.Services.Interfaces;

namespace SocialSport.Api.Services.Implementations;

public class CommentService : ICommentService
{
    private readonly IPostAccessService _postAccessService;
    private readonly ICommentRepository _commentRepository;
    private readonly IPostRepository _postRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificationService _notificationService;
    private readonly ApplicationDbContext _context;

    public CommentService(
        ICommentRepository commentRepository,
        IPostRepository postRepository,
        UserManager<ApplicationUser> userManager,
        IPostAccessService postAccessService,
        INotificationService notificationService,
        ApplicationDbContext context)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
        _userManager = userManager;
        _postAccessService = postAccessService;
        _notificationService = notificationService;
        _context = context;
    }

    public async Task<List<CommentDto>> GetByPostIdAsync(
        Guid postId,
        Guid? currentUserId)
    {
        var post = await _postRepository.GetByIdAsync(postId);

        if (post is null || post.Status != PostStatus.Published)
        {
            throw new KeyNotFoundException("Không tìm thấy bài viết.");
        }

        await _postAccessService.EnsureCanViewAsync(currentUserId, post);

        var comments = await _commentRepository.GetByPostIdAsync(postId);
        var commentsById = comments.ToDictionary(x => x.Id);
        var authorIds = comments
            .Select(x => x.AuthorId)
            .Distinct()
            .ToList();
        var users = await _userManager.Users
            .Where(x => authorIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id);
        var groupOwnerId = post.GroupId.HasValue
            ? await _context.Groups
                .AsNoTracking()
                .Where(x => x.Id == post.GroupId.Value)
                .Select(x => (Guid?)x.OwnerId)
                .FirstOrDefaultAsync()
            : null;
        var groupRoles = post.GroupId.HasValue
            ? await _context.GroupMembers
                .AsNoTracking()
                .Where(x =>
                    x.GroupId == post.GroupId.Value
                    && x.Status == GroupMemberStatus.Active
                    && authorIds.Contains(x.UserId))
                .ToDictionaryAsync(x => x.UserId, x => x.Role)
            : new Dictionary<Guid, GroupMemberRole>();

        var dtos = comments.ToDictionary(x => x.Id, x =>
        {
            users.TryGetValue(x.AuthorId, out var author);
            commentsById.TryGetValue(
                x.ParentCommentId ?? Guid.Empty,
                out var parent);
            ApplicationUser? replyUser = null;
            if (parent is not null)
            {
                users.TryGetValue(parent.AuthorId, out replyUser);
            }

            return new CommentDto
            {
                Id = x.Id,
                PostId = x.PostId,
                AuthorId = x.AuthorId,
                AuthorName = author?.DisplayName ?? string.Empty,
                AuthorAvatar = author?.AvatarUrl,
                AuthorGroupRole = GroupRoleLabel(
                    x.AuthorId,
                    groupOwnerId,
                    groupRoles),
                ParentCommentId = x.ParentCommentId,
                ReplyToUserId = parent?.AuthorId,
                ReplyToUserName = replyUser?.DisplayName,
                Content = x.Status == CommentStatus.Deleted
                    ? "Bình luận đã bị xóa."
                    : x.Content,
                IsDeleted = x.Status == CommentStatus.Deleted,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            };
        });

        var result = new List<CommentDto>();
        foreach (var comment in comments)
        {
            var dto = dtos[comment.Id];
            if (comment.ParentCommentId.HasValue
                && dtos.TryGetValue(
                    comment.ParentCommentId.Value,
                    out var parent))
            {
                parent.Replies.Add(dto);
            }
            else
            {
                result.Add(dto);
            }
        }

        return result;
    }

    public async Task<CommentDto> CreateAsync(
        Guid userId,
        Guid postId,
        CreateCommentRequest request)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post is null || post.Status != PostStatus.Published)
        {
            throw new KeyNotFoundException("Không tìm thấy bài viết.");
        }

        await _postAccessService.EnsureCanInteractAsync(userId, post);

        Comment? parent = null;
        if (request.ParentCommentId.HasValue)
        {
            parent = await _commentRepository.GetByIdAsync(
                request.ParentCommentId.Value);
            if (parent is null
                || parent.PostId != postId
                || parent.Status != CommentStatus.Published)
            {
                throw new InvalidOperationException(
                    "Bình luận cha không hợp lệ.");
            }
        }

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            PostId = postId,
            AuthorId = userId,
            ParentCommentId = request.ParentCommentId,
            Content = request.Content.Trim(),
            Status = CommentStatus.Published,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await _commentRepository.AddAsync(comment);
        await _commentRepository.SaveChangesAsync();

        if (parent is not null)
        {
            await _notificationService.CreateAsync(
                parent.AuthorId,
                userId,
                NotificationType.CommentReply,
                post.Id);
        }

        if (parent?.AuthorId != post.AuthorId)
        {
            await _notificationService.CreateAsync(
                post.AuthorId,
                userId,
                NotificationType.Comment,
                post.Id);
        }

        return await BuildCommentDtoAsync(comment, post, parent);
    }

    public async Task<CommentDto> UpdateAsync(
        Guid userId,
        Guid commentId,
        UpdateCommentRequest request)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId);
        if (comment is null || comment.Status != CommentStatus.Published)
        {
            throw new KeyNotFoundException("Không tìm thấy bình luận.");
        }

        var post = await _postRepository.GetByIdAsync(comment.PostId);
        if (post is null || post.Status != PostStatus.Published)
        {
            throw new KeyNotFoundException("Không tìm thấy bài viết.");
        }

        await _postAccessService.EnsureCanInteractAsync(userId, post);
        if (comment.AuthorId != userId)
        {
            throw new UnauthorizedAccessException(
                "Bạn không có quyền sửa bình luận này.");
        }

        comment.Content = request.Content.Trim();
        comment.UpdatedAt = DateTimeOffset.UtcNow;
        await _commentRepository.SaveChangesAsync();

        var parent = comment.ParentCommentId.HasValue
            ? await _commentRepository.GetByIdAsync(
                comment.ParentCommentId.Value)
            : null;
        return await BuildCommentDtoAsync(comment, post, parent);
    }

    public async Task DeleteAsync(Guid userId, Guid commentId)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId);
        if (comment is null || comment.Status == CommentStatus.Deleted)
        {
            throw new KeyNotFoundException("Không tìm thấy bình luận.");
        }

        var post = await _postRepository.GetByIdAsync(comment.PostId);
        if (post is null || post.Status != PostStatus.Published)
        {
            throw new KeyNotFoundException("Không tìm thấy bài viết.");
        }

        await _postAccessService.EnsureCanInteractAsync(userId, post);
        if (comment.AuthorId != userId)
        {
            throw new UnauthorizedAccessException(
                "Bạn không có quyền xóa bình luận này.");
        }

        comment.Status = CommentStatus.Deleted;
        comment.DeletedAt = DateTimeOffset.UtcNow;
        await _commentRepository.SaveChangesAsync();
    }

    private async Task<CommentDto> BuildCommentDtoAsync(
        Comment comment,
        Post post,
        Comment? parent)
    {
        var author = await _userManager.FindByIdAsync(
            comment.AuthorId.ToString());
        var replyUser = parent is null
            ? null
            : await _userManager.FindByIdAsync(parent.AuthorId.ToString());
        Guid? groupOwnerId = null;
        var groupRoles = new Dictionary<Guid, GroupMemberRole>();

        if (post.GroupId.HasValue)
        {
            groupOwnerId = await _context.Groups
                .AsNoTracking()
                .Where(x => x.Id == post.GroupId.Value)
                .Select(x => (Guid?)x.OwnerId)
                .FirstOrDefaultAsync();
            var role = await _context.GroupMembers
                .AsNoTracking()
                .Where(x =>
                    x.GroupId == post.GroupId.Value
                    && x.UserId == comment.AuthorId
                    && x.Status == GroupMemberStatus.Active)
                .Select(x => (GroupMemberRole?)x.Role)
                .FirstOrDefaultAsync();
            if (role.HasValue)
            {
                groupRoles[comment.AuthorId] = role.Value;
            }
        }

        return new CommentDto
        {
            Id = comment.Id,
            PostId = comment.PostId,
            AuthorId = comment.AuthorId,
            AuthorName = author?.DisplayName ?? string.Empty,
            AuthorAvatar = author?.AvatarUrl,
            AuthorGroupRole = GroupRoleLabel(
                comment.AuthorId,
                groupOwnerId,
                groupRoles),
            ParentCommentId = comment.ParentCommentId,
            ReplyToUserId = parent?.AuthorId,
            ReplyToUserName = replyUser?.DisplayName,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        };
    }

    private static string? GroupRoleLabel(
        Guid authorId,
        Guid? groupOwnerId,
        IReadOnlyDictionary<Guid, GroupMemberRole> roles)
    {
        if (groupOwnerId == authorId)
        {
            return "Chủ nhóm";
        }

        if (!roles.TryGetValue(authorId, out var role))
        {
            return null;
        }

        return role switch
        {
            GroupMemberRole.Admin => "Quản trị viên",
            GroupMemberRole.Moderator => "Kiểm duyệt viên",
            _ => null
        };
    }
}
