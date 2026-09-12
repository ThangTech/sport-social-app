using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.DTOs.Post;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;
using SocialSport.Api.Services.Interfaces;
using System.Text;
using Microsoft.AspNetCore.Http;

namespace SocialSport.Api.Services.Implementations
{
    public class PostService : IPostService
    {
        private readonly IPostRepository _postRepository;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ISavedPostRepository _savedPostRepository;
        private readonly IWebHostEnvironment _environment;

        public PostService(IPostRepository postRepository, UserManager<ApplicationUser> userManager, ISavedPostRepository savedPostRepository, IWebHostEnvironment environment)
        {
            _postRepository = postRepository;
            _userManager = userManager;
            _savedPostRepository = savedPostRepository;
            _environment = environment;
        }
        public async Task<ReactionResponse> ReactAsync(Guid userId, Guid postId, ReactionRequest request)
        {
            var post = await _postRepository.GetByIdAsync(postId);

            if (post is null || post.Status != PostStatus.Published)
                throw new KeyNotFoundException("Không tìm thấy bài viết.");

            var reaction = await _postRepository.GetReactionAsync(postId, userId);

            if (reaction is null)
            {
                reaction = new PostReaction
                {
                    PostId = postId,
                    UserId = userId,
                    Type = request.Type,
                    CreatedAt = DateTimeOffset.UtcNow
                };

                await _postRepository.AddReactionAsync(reaction);
            }
            else
            {
                reaction.Type = request.Type;
            }

            await _postRepository.SaveChangesAsync();

            var updatedPost = await _postRepository.GetByIdAsync(postId);

            return new ReactionResponse
            {
                ReactionCount = updatedPost!.Reactions.Count,
                CurrentReaction = request.Type
            };
        }
        public async Task<ReactionResponse> RemoveReactionAsync(Guid userId, Guid postId)
        {
            var post = await _postRepository.GetByIdAsync(postId);

            if (post is null || post.Status != PostStatus.Published)
                throw new KeyNotFoundException("Không tìm thấy bài viết.");

            var reaction = await _postRepository.GetReactionAsync(postId, userId);

            if (reaction is not null)
            {
                _postRepository.RemoveReaction(reaction);
                await _postRepository.SaveChangesAsync();
            }

            var updatedPost = await _postRepository.GetByIdAsync(postId);

            return new ReactionResponse
            {
                ReactionCount = updatedPost!.Reactions.Count,
                CurrentReaction = null
            };
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
        public async Task<FeedResponse> GetFeedAsync(Guid userId, int limit, string? cursor)
        {
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

            var posts = await _postRepository.GetFeedAsync(userId, limit, cursorDate);
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
                var lastCreatedAt = posts[^1].CreatedAt.ToString("O");
                nextCursor = Convert.ToBase64String(Encoding.UTF8.GetBytes(lastCreatedAt));
            }

            return new FeedResponse
            {
                Items = items,
                NextCursor = nextCursor
            };
        }

        public async Task SavePostAsync(Guid userId, Guid postId)
        {
            var post = await _postRepository.GetByIdAsync(postId);

            if (post is null || post.Status != PostStatus.Published)
                throw new KeyNotFoundException("Không tìm thấy bài viết.");

            if (await _savedPostRepository.GetAsync(userId, postId) is not null)
                return;

            var savedPost = new SavedPost
            {
                UserId = userId,
                PostId = postId,
                CreatedAt = DateTimeOffset.UtcNow
            };

            await _savedPostRepository.AddAsync(savedPost);
            await _savedPostRepository.SaveChangesAsync();
        }

        public async Task UnsavePostAsync(Guid userId, Guid postId)
        {
            var savedPost = await _savedPostRepository.GetAsync(userId, postId);

            if (savedPost is null)
                return;

            _savedPostRepository.Remove(savedPost);
            await _savedPostRepository.SaveChangesAsync();
        }

        public async Task<List<PostDto>> GetSavedPostsAsync(Guid userId)
        {
            var posts = await _savedPostRepository.GetSavedPostsAsync(userId);
            var authorIds = posts.Select(x => x.AuthorId).Distinct().ToList();

            var users = await _userManager.Users
                .Where(x => authorIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id);

            return posts.Select(post =>
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
        }
        public async Task<PostMediaUploadResponse> UploadMediaAsync(Guid userId, Guid postId, IFormFile file)
        {
            var post = await _postRepository.GetByIdAsync(postId);

            if (post is null || post.Status != PostStatus.Published)
                throw new KeyNotFoundException("Không tìm thấy bài viết.");

            if (post.AuthorId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền thêm media vào bài viết này.");

            if (file.Length == 0)
                throw new InvalidOperationException("File không hợp lệ.");

            if (file.Length > 20 * 1024 * 1024)
                throw new InvalidOperationException("File không được vượt quá 20MB.");

            var mediaType = GetMediaType(file.ContentType);

            var uploadFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads", "posts");

            Directory.CreateDirectory(uploadFolder);

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadFolder, fileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var media = new PostMedia
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                Url = $"/uploads/posts/{fileName}",
                MediaType = mediaType,
                SortOrder = post.Media.Count,
                CreatedAt = DateTimeOffset.UtcNow
            };

            await _postRepository.AddMediaAsync(media);
            await _postRepository.SaveChangesAsync();

            return new PostMediaUploadResponse
            {
                Id = media.Id,
                Url = media.Url,
                MediaType = (int)media.MediaType,
                SortOrder = media.SortOrder
            };
        }
        public async Task DeleteMediaAsync(Guid userId, Guid postId, Guid mediaId)
        {
            var post = await _postRepository.GetByIdAsync(postId);

            if (post is null || post.Status != PostStatus.Published)
                throw new KeyNotFoundException("Không tìm thấy bài viết.");

            if (post.AuthorId != userId)
                throw new UnauthorizedAccessException("Bạn không có quyền xóa media của bài viết này.");

            var media = await _postRepository.GetMediaByIdAsync(mediaId);

            if (media is null || media.PostId != postId)
                throw new KeyNotFoundException("Không tìm thấy media.");

            var relativePath = media.Url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), relativePath);

            if (File.Exists(fullPath))
                File.Delete(fullPath);

            _postRepository.RemoveMedia(media);
            await _postRepository.SaveChangesAsync();
        }
        private static MediaType GetMediaType(string contentType)
        {
            if (contentType.StartsWith("image/"))
                return MediaType.Image;

            if (contentType.StartsWith("video/"))
                return MediaType.Video;

            throw new InvalidOperationException("Chỉ hỗ trợ file ảnh hoặc video.");
        }
    }
}