using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.DTOs.Comment;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;
using SocialSport.Api.Services.Interfaces;

namespace SocialSport.Api.Services.Implementations;

public class CommentService : ICommentService
{
    private readonly ICommentRepository _commentRepository;
    private readonly IPostRepository _postRepository;
    private readonly UserManager<ApplicationUser> _userManager;

    public CommentService(ICommentRepository commentRepository, IPostRepository postRepository, UserManager<ApplicationUser> userManager)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
        _userManager = userManager;
    }

    public async Task<List<CommentDto>> GetByPostIdAsync(Guid postId)
    {
        if (!await _postRepository.ExistsAsync(postId))
            throw new KeyNotFoundException("Không tìm thấy bài viết.");

        var comments = await _commentRepository.GetByPostIdAsync(postId);
        var authorIds = comments.Select(x => x.AuthorId).Distinct().ToList();

        var users = await _userManager.Users
            .Where(x => authorIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id);

        var dtos = comments.ToDictionary(x => x.Id, x =>
        {
            users.TryGetValue(x.AuthorId, out var author);

            return new CommentDto
            {
                Id = x.Id,
                PostId = x.PostId,
                AuthorId = x.AuthorId,
                AuthorName = author?.DisplayName ?? string.Empty,
                AuthorAvatar = author?.AvatarUrl,
                ParentCommentId = x.ParentCommentId,
                Content = x.Status == CommentStatus.Deleted ? "Bình luận đã bị xóa." : x.Content,
                IsDeleted = x.Status == CommentStatus.Deleted,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            };
        });

        var result = new List<CommentDto>();

        foreach (var comment in comments)
        {
            var dto = dtos[comment.Id];

            if (comment.ParentCommentId.HasValue && dtos.TryGetValue(comment.ParentCommentId.Value, out var parent))
                parent.Replies.Add(dto);
            else
                result.Add(dto);
        }

        return result;
    }

    public async Task<CommentDto> CreateAsync(Guid userId, Guid postId, CreateCommentRequest request)
    {
        if (!await _postRepository.ExistsAsync(postId))
            throw new KeyNotFoundException("Không tìm thấy bài viết.");

        if (request.ParentCommentId.HasValue)
        {
            var parent = await _commentRepository.GetByIdAsync(request.ParentCommentId.Value);

            if (parent is null || parent.PostId != postId || parent.Status != CommentStatus.Published)
                throw new InvalidOperationException("Bình luận cha không hợp lệ.");
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

        var user = await _userManager.FindByIdAsync(userId.ToString());

        return new CommentDto
        {
            Id = comment.Id,
            PostId = comment.PostId,
            AuthorId = comment.AuthorId,
            AuthorName = user?.DisplayName ?? string.Empty,
            AuthorAvatar = user?.AvatarUrl,
            ParentCommentId = comment.ParentCommentId,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt
        };
    }

    public async Task<CommentDto> UpdateAsync(Guid userId, Guid commentId, UpdateCommentRequest request)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId);

        if (comment is null || comment.Status != CommentStatus.Published)
            throw new KeyNotFoundException("Không tìm thấy bình luận.");

        if (comment.AuthorId != userId)
            throw new UnauthorizedAccessException("Bạn không có quyền sửa bình luận này.");

        comment.Content = request.Content.Trim();
        comment.UpdatedAt = DateTimeOffset.UtcNow;

        await _commentRepository.SaveChangesAsync();

        var user = await _userManager.FindByIdAsync(userId.ToString());

        return new CommentDto
        {
            Id = comment.Id,
            PostId = comment.PostId,
            AuthorId = comment.AuthorId,
            AuthorName = user?.DisplayName ?? string.Empty,
            AuthorAvatar = user?.AvatarUrl,
            ParentCommentId = comment.ParentCommentId,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt
        };
    }

    public async Task DeleteAsync(Guid userId, Guid commentId)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId);

        if (comment is null || comment.Status == CommentStatus.Deleted)
            throw new KeyNotFoundException("Không tìm thấy bình luận.");

        if (comment.AuthorId != userId)
            throw new UnauthorizedAccessException("Bạn không có quyền xóa bình luận này.");

        comment.Status = CommentStatus.Deleted;
        comment.DeletedAt = DateTimeOffset.UtcNow;

        await _commentRepository.SaveChangesAsync();
    }
}