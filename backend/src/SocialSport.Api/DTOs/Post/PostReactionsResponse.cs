namespace SocialSport.Api.DTOs.Post
{
    public class PostReactionsResponse
    {
        public List<PostReactionDto> Items { get; set; } = [];
        public string? NextCursor { get; set; }
    }
}
