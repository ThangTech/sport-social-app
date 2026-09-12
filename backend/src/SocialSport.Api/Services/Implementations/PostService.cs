using Microsoft.AspNetCore.Identity;
using SocialSport.Api.DTOs.Post;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;
using SocialSport.Api.Services.Interfaces;

namespace SocialSport.Api.Services.Implementations
{
    public class PostService : IPostService
    {
        private readonly IPostRepository _postRepository;
        private readonly UserManager<ApplicationUser> _userManager;

        public PostService(IPostRepository postRepository, UserManager<ApplicationUser> userManager)
        {
            _postRepository = postRepository;
            _userManager = userManager;
        }

        public async Task<PostDto> CreateAsync(Guid userId, CreatePostRequest request)
        {
            if (request.SportId.HasValue && !await _postRepository.SportExistsAsync(request.SportId.Value))
                throw new KeyNotFoundException("Không tìm thấy môn thể thao.");

            var post = new Post
            {
                Id = Guid.NewGuid(),
                AuthorId = userId,
                SportId = request.SportId,
                Content = request.Content.Trim(),
                Visibility = request.Visibility,
                Status = PostStatus.Published,
                CreatedAt = DateTimeOffset.UtcNow
            };

            await _postRepository.AddAsync(post);
            await _postRepository.SaveChangesAsync();

            var createdPost = await _postRepository.GetByIdAsync(post.Id);
            var user = await _userManager.FindByIdAsync(createdPost!.AuthorId.ToString());

            return new PostDto
            {
                Id = createdPost.Id,
                AuthorId = createdPost.AuthorId,
                AuthorName = user?.DisplayName ?? string.Empty,
                AuthorAvatar = user?.AvatarUrl,
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

        public async Task<PostDto?> GetByIdAsync(Guid postId)
        {
            var post = await _postRepository.GetByIdAsync(postId);

            if (post is null || post.Status != PostStatus.Published)
                return null;

            var user = await _userManager.FindByIdAsync(post.AuthorId.ToString());

            return new PostDto
            {
                Id = post.Id,
                AuthorId = post.AuthorId,
                AuthorName = user?.DisplayName ?? string.Empty,
                AuthorAvatar = user?.AvatarUrl,
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
        }

        public async Task<List<PostDto>> GetUserPostsAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user is null)
                throw new KeyNotFoundException("Không tìm thấy người dùng.");

            var posts = await _postRepository.GetByUserIdAsync(userId);

            return posts.Select(post => new PostDto
            {
                Id = post.Id,
                AuthorId = post.AuthorId,
                AuthorName = user.DisplayName ?? string.Empty,
                AuthorAvatar = user.AvatarUrl,
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
            }).ToList();
        }

        public async Task<PostDto> UpdateAsync(Guid userId, Guid postId, UpdatePostRequest request)
        {
            var post = await _postRepository.GetByIdAsync(postId);

            if (post is null || post.Status == PostStatus.Deleted)
                throw new KeyNotFoundException("Không tìm thấy bài viết.");

            if (post.AuthorId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền sửa bài viết này.");

            if (request.SportId.HasValue && !await _postRepository.SportExistsAsync(request.SportId.Value))
                throw new KeyNotFoundException("Không tìm thấy môn thể thao.");

            post.Content = request.Content.Trim();
            post.SportId = request.SportId;
            post.Visibility = request.Visibility;
            post.UpdatedAt = DateTimeOffset.UtcNow;

            await _postRepository.SaveChangesAsync();

            var user = await _userManager.FindByIdAsync(post.AuthorId.ToString());

            return new PostDto
            {
                Id = post.Id,
                AuthorId = post.AuthorId,
                AuthorName = user?.DisplayName ?? string.Empty,
                AuthorAvatar = user?.AvatarUrl,
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
        }

        public async Task DeleteAsync(Guid userId, Guid postId)
        {
            var post = await _postRepository.GetByIdAsync(postId);

            if (post is null || post.Status == PostStatus.Deleted)
                throw new KeyNotFoundException("Không tìm thấy bài viết.");

            if (post.AuthorId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền xóa bài viết này.");

            post.Status = PostStatus.Deleted;
            post.DeletedAt = DateTimeOffset.UtcNow;

            await _postRepository.SaveChangesAsync();
        }
    }
}