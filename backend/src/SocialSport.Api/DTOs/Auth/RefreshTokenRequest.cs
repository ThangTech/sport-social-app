using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Auth
{
    public class RefreshTokenRequest
    {
      
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
