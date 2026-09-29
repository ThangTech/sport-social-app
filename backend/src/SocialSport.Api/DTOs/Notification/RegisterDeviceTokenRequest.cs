using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Notification;

public class RegisterDeviceTokenRequest
{
    [Required, StringLength(500)]
    public string ExpoPushToken { get; set; } = string.Empty;

    [Required, RegularExpression("ios|android")]
    public string Platform { get; set; } = string.Empty;
}
