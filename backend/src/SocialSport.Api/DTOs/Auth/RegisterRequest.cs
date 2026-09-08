using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Auth;

public class RegisterRequest
{
    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
}