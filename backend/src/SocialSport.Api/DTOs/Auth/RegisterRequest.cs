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
    [RegularExpression(
        @"^(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$",
        ErrorMessage = "Mật khẩu phải tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và ít nhất một chữ số hoặc ký tự đặc biệt."
    )]
    public string Password { get; set; } = string.Empty;
}