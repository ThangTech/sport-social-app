using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.User
{
    public class UpdateProfileRequest
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string DisplayName { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Bio { get; set; }

        public DateOnly? DateOfBirth { get; set; }
    }
}
