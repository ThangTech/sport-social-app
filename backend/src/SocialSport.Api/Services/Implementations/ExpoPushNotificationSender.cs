using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Services.Interfaces;

namespace SocialSport.Api.Services.Implementations;

public class ExpoPushNotificationSender : IPushNotificationSender
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ExpoPushNotificationSender> _logger;

    public ExpoPushNotificationSender(ApplicationDbContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<ExpoPushNotificationSender> logger)
    {
        _context = context; _httpClientFactory = httpClientFactory; _configuration = configuration; _logger = logger;
    }

    public async Task SendAsync(Guid userId, string body, NotificationType type, Guid? entityId, Guid? actorId, CancellationToken cancellationToken = default)
    {
        var tokens = await _context.DeviceTokens.Where(x => x.UserId == userId && x.IsActive).OrderByDescending(x => x.LastUsedAt).Take(10).ToListAsync(cancellationToken);
        if (tokens.Count == 0) return;
        try
        {
            var client = _httpClientFactory.CreateClient("ExpoPush");
            var accessToken = _configuration["Expo:AccessToken"];
            if (!string.IsNullOrWhiteSpace(accessToken)) client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            var messages = tokens.Select(x => new { to = x.ExpoPushToken, title = "SocialSport", body, sound = "default", data = new { type = (int)type, entityId, actorId } }).ToArray();
            using var response = await client.PostAsJsonAsync("--/api/v2/push/send", messages, cancellationToken);
            response.EnsureSuccessStatusCode();
            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
            if (!document.RootElement.TryGetProperty("data", out var tickets) || tickets.ValueKind != JsonValueKind.Array) return;
            var changed = false;
            for (var i = 0; i < Math.Min(tokens.Count, tickets.GetArrayLength()); i++)
            {
                var ticket = tickets[i];
                if (ticket.TryGetProperty("details", out var details) && details.TryGetProperty("error", out var error) && error.GetString() == "DeviceNotRegistered")
                { tokens[i].IsActive = false; tokens[i].UpdatedAt = DateTimeOffset.UtcNow; changed = true; }
            }
            if (changed) await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            _logger.LogWarning(ex, "Push delivery failed for user {UserId}; the in-app notification remains available.", userId);
        }
    }
}
