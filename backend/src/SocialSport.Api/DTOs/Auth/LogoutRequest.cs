using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Auth
{
    public class LogoutRequest
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
