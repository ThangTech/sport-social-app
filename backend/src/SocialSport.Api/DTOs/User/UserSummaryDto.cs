namespace SocialSport.Api.DTOs.User
{
    public class UserSummaryDto
    {
        public Guid Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
    }
}
