namespace SocialSport.Api.DTOs.Auth
{
    public class AuthUserDto
    {
        public Guid Id { get; set; }

        public string UserName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string DisplayName { get; set; } = string.Empty;

        public string? AvatarUrl { get; set; }

        public IList<string> Roles { get; set; } = [];
    }
}
