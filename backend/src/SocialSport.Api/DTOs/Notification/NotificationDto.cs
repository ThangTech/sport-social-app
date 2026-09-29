using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.DTOs.Notification;

public class NotificationDto
{
    public Guid Id { get; set; }
    public NotificationType Type { get; set; }
    public Guid? ActorId { get; set; }
    public string? ActorName { get; set; }
    public string? ActorAvatarUrl { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid? PostId { get; set; }
    public Guid? GroupId { get; set; }
    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
