using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialSport.Api.DTOs.Notification;
using SocialSport.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialSport.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    public NotificationsController(INotificationService notificationService) => _notificationService = notificationService;

    [HttpGet]
    public async Task<ActionResult<NotificationsResponse>> Get([FromQuery] int limit = 20, [FromQuery] string? cursor = null) =>
        Ok(await _notificationService.GetAsync(GetCurrentUserId(), limit, cursor));

    [HttpGet("unread-count")]
    public async Task<ActionResult<UnreadNotificationCountDto>> GetUnreadCount() =>
        Ok(new UnreadNotificationCountDto { Count = await _notificationService.GetUnreadCountAsync(GetCurrentUserId()) });

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        await _notificationService.MarkReadAsync(GetCurrentUserId(), id);
        return NoContent();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _notificationService.MarkAllReadAsync(GetCurrentUserId());
        return NoContent();
    }

    [HttpPost("devices")]
    public async Task<IActionResult> RegisterDevice(RegisterDeviceTokenRequest request)
    {
        await _notificationService.RegisterDeviceAsync(GetCurrentUserId(), request.ExpoPushToken, request.Platform);
        return NoContent();
    }

    [HttpDelete("devices")]
    public async Task<IActionResult> UnregisterDevice(RegisterDeviceTokenRequest request)
    {
        await _notificationService.UnregisterDeviceAsync(GetCurrentUserId(), request.ExpoPushToken);
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(value, out var userId)) throw new UnauthorizedAccessException("User id trong token không hợp lệ.");
        return userId;
    }
}
