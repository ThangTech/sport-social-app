namespace SocialSport.Api.DTOs.Post
{
    public class PostReactionDto
    {
        public Guid UserId { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public DateTimeOffset ReactedAt { get; set; }
    }
}
