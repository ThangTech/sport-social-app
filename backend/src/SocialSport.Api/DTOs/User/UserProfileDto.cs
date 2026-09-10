namespace SocialSport.Api.DTOs.User
{
    public class UserProfileDto
    {
        public Guid Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? CoverUrl { get; set; }
        public string? Bio { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public int FollowerCount { get; set; }
        public int FollowingCount { get; set; }
        public bool IsFollowing { get; set; }
    }
}
