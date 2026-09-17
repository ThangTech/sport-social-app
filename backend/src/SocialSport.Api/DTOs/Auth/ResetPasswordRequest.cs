using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Auth
{
    public class ResetPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        public string NewPassword { get; set; } = string.Empty;

        [Required]
        [RegularExpression(
        @"^(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$",
        ErrorMessage = "Mật khẩu phải tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và ít nhất một chữ số hoặc ký tự đặc biệt."
    )]
        [Compare(nameof(NewPassword))]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
