using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Auth
{
    public class LoginRequest
    {
        [Required(ErrorMessage = "Email không được để trống.")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu không được để trống.")]
        [RegularExpression(
            @"^(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$",
            ErrorMessage = "Mật khẩu phải tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và ít nhất một chữ số hoặc ký tự đặc biệt."
        )]
        public string Password { get; set; } = string.Empty;
    }
}