namespace SocialSport.Api.DTOs.Notification;

public class NotificationsResponse
{
    public List<NotificationDto> Items { get; set; } = [];
    public string? NextCursor { get; set; }
}
