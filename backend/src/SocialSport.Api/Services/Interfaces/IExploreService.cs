using SocialSport.Api.DTOs.Common;
using SocialSport.Api.DTOs.Group;
using SocialSport.Api.DTOs.Post;
using SocialSport.Api.DTOs.User;

namespace SocialSport.Api.Services.Interfaces;

public interface IExploreService
{
    Task<PagedResponse<PostDto>> GetPostsAsync(Guid userId, string? search, Guid? sportId, string? sort, int page, int pageSize);
    Task<PagedResponse<GroupDto>> GetGroupsAsync(Guid userId, string? search, string? sort, int page, int pageSize);
    Task<PagedResponse<UserSummaryDto>> GetUsersAsync(Guid userId, string? search, string? sort, int page, int pageSize);
}
