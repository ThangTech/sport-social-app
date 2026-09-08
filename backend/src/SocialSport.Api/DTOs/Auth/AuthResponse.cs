namespace SocialSport.Api.DTOs.Auth
{
    public class AuthResponse
    {
        public string AccessToken { get; set; } = string.Empty;

        public DateTimeOffset AccessTokenExpiresAt { get; set; }

        public string RefreshToken { get; set; } = string.Empty;

        public DateTimeOffset RefreshTokenExpiresAt { get; set; }

        public AuthUserDto User { get; set; } = null!;
    }
}
