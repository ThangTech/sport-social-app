namespace SocialSport.Api.DTOs.Post
{
    public class FeedResponse
    {
        public List<PostDto> Items { get; set; } = [];
        public string? NextCursor { get; set; }
    }
}
