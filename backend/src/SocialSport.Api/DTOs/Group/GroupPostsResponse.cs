using SocialSport.Api.DTOs.Post;

namespace SocialSport.Api.DTOs.Group
{
    public class GroupPostsResponse
    {
        public List<PostDto> Items { get; set; } = [];
        public string? NextCursor { get; set; }
    }
}
