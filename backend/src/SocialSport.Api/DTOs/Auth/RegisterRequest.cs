using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Auth
{
    public class RegisterRequest
    {
        [Required(ErrorMessage = "Tên đăng nhập không được để trống.")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Tên đăng nhập phải từ 3 đến 50 ký tự.")]
        public string UserName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email không được để trống.")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên hiển thị không được để trống.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Tên hiển thị phải từ 2 đến 100 ký tự.")]
        public string DisplayName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mật khẩu không được để trống.")]
        [RegularExpression(
            @"^(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$",
            ErrorMessage = "Mật khẩu phải tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và ít nhất một chữ số hoặc ký tự đặc biệt."
        )]
        public string Password { get; set; } = string.Empty;
    }
}