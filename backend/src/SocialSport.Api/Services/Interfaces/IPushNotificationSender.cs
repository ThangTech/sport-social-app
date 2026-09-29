using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Services.Interfaces;

public interface IPushNotificationSender
{
    Task SendAsync(Guid userId, string body, NotificationType type, Guid? entityId, CancellationToken cancellationToken = default);
}
