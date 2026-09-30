using SocialSport.Api.DTOs.Notification;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Services.Interfaces;

public interface INotificationService
{
    Task CreateAsync(Guid userId, Guid? actorId, NotificationType type, Guid? entityId = null);
    Task<NotificationsResponse> GetAsync(Guid userId, int limit, string? cursor);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task MarkReadAsync(Guid userId, Guid notificationId);
    Task MarkAllReadAsync(Guid userId);
    Task DeleteAllAsync(Guid userId);
    Task RegisterDeviceAsync(Guid userId, string expoPushToken, string platform);
    Task UnregisterDeviceAsync(Guid userId, string expoPushToken);
}
