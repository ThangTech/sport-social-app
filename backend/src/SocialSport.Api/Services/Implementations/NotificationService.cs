using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.DTOs.Notification;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;
using SocialSport.Api.Services.Interfaces;
using System.Globalization;
using System.Text;

namespace SocialSport.Api.Services.Implementations;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IPostRepository _postRepository;
    private readonly IPostAccessService _postAccessService;
    private readonly IGroupRepository _groupRepository;
    private readonly IGroupMemberRepository _groupMemberRepository;
    private readonly IPushNotificationSender _pushSender;

    public NotificationService(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IPostRepository postRepository,
        IPostAccessService postAccessService,
        IGroupRepository groupRepository,
        IGroupMemberRepository groupMemberRepository,
        IPushNotificationSender pushSender)
    {
        _context = context;
        _userManager = userManager;
        _postRepository = postRepository;
        _postAccessService = postAccessService;
        _groupRepository = groupRepository;
        _groupMemberRepository = groupMemberRepository;
        _pushSender = pushSender;
    }

    public async Task CreateAsync(Guid userId, Guid? actorId, NotificationType type, Guid? entityId = null)
    {
        if (actorId == userId) return;

        await _context.Notifications.AddAsync(new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ActorId = actorId,
            Type = type,
            EntityId = entityId,
            IsRead = false,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await _context.SaveChangesAsync();
        await _pushSender.SendAsync(userId, GetMessage(type, await ActorName(actorId)), type, entityId, actorId);
    }

    public async Task<NotificationsResponse> GetAsync(Guid userId, int limit, string? cursor)
    {
        limit = Math.Clamp(limit, 1, 50);
        var (cursorCreatedAt, cursorId) = DecodeCursor(cursor);
        var query = _context.Notifications.AsNoTracking().Where(x => x.UserId == userId);

        if (cursorCreatedAt.HasValue && cursorId.HasValue)
        {
            query = query.Where(x => x.CreatedAt < cursorCreatedAt.Value ||
                (x.CreatedAt == cursorCreatedAt.Value && x.Id.CompareTo(cursorId.Value) < 0));
        }

        var notifications = await query
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .Take(limit + 1)
            .ToListAsync();
        var hasMore = notifications.Count > limit;
        if (hasMore) notifications = notifications.Take(limit).ToList();

        var actorIds = notifications.Where(x => x.ActorId.HasValue).Select(x => x.ActorId!.Value).Distinct().ToList();
        var actors = await _userManager.Users.Where(x => actorIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id);
        var items = new List<NotificationDto>();

        foreach (var notification in notifications)
        {
            actors.TryGetValue(notification.ActorId ?? Guid.Empty, out var actor);
            var dto = new NotificationDto
            {
                Id = notification.Id,
                Type = notification.Type,
                ActorId = actor?.Id,
                ActorName = actor?.DisplayName,
                ActorAvatarUrl = actor?.AvatarUrl,
                Message = GetMessage(notification.Type, actor?.DisplayName),
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            };

            if (notification.Type is
                NotificationType.PostReaction
                or NotificationType.Comment
                or NotificationType.CommentReply
                or NotificationType.GroupPostApproved)
            {
                var post = notification.EntityId.HasValue ? await _postRepository.GetByIdAsync(notification.EntityId.Value) : null;
                if (post is not null
                    && await _postAccessService.CanViewAsync(userId, post))
                {
                    dto.PostId = post.Id;
                    dto.TargetTitle = post.Group?.Name ?? "Bài viết";
                    dto.TargetPreview = Preview(post.Content);
                }
                else if (post is not null
                    && notification.Type == NotificationType.GroupPostApproved
                    && post.AuthorId == userId)
                {
                    dto.TargetTitle = post.Group?.Name ?? "Bài viết trong nhóm";
                    dto.TargetPreview = Preview(post.Content);
                }
            }
            else if (notification.Type is NotificationType.GroupJoinApproved or NotificationType.GroupJoinRejected)
            {
                var group = notification.EntityId.HasValue ? await _groupRepository.GetByIdAsync(notification.EntityId.Value) : null;
                if (group?.Status == GroupStatus.Active)
                {
                    dto.TargetTitle = group.Name;
                    var member = await _groupMemberRepository.GetAsync(group.Id, userId);
                    if (group.Privacy == GroupPrivacy.Public || member?.Status == GroupMemberStatus.Active) dto.GroupId = group.Id;
                }
            }
            else if (notification.Type is
                NotificationType.GroupPostReviewPending
                or NotificationType.GroupPostRejected)
            {
                var post = notification.EntityId.HasValue
                    ? await _postRepository.GetByIdAsync(
                        notification.EntityId.Value)
                    : null;
                var group = post?.Group;
                if (group?.Status == GroupStatus.Active)
                {
                    dto.TargetTitle = group.Name;
                    dto.TargetPreview = Preview(post?.Content);
                    var member = await _groupMemberRepository.GetAsync(
                        group.Id,
                        userId);
                    if (member?.Status == GroupMemberStatus.Active)
                    {
                        dto.GroupId = group.Id;
                    }
                }
            }
            else if (notification.Type is
                NotificationType.CopyrightReviewPending
                or NotificationType.CopyrightConfirmed
                or NotificationType.CopyrightDismissed
                or NotificationType.CopyrightAppealResolved
                or NotificationType.CopyrightScanResolved)
            {
                dto.CopyrightReviewId = notification.EntityId;
            }

            items.Add(dto);
        }

        return new NotificationsResponse
        {
            Items = items,
            NextCursor = hasMore && notifications.Count > 0
                ? EncodeCursor(notifications[^1].CreatedAt, notifications[^1].Id)
                : null
        };
    }

    public Task<int> GetUnreadCountAsync(Guid userId) =>
        _context.Notifications.CountAsync(x => x.UserId == userId && !x.IsRead);

    public async Task MarkReadAsync(Guid userId, Guid notificationId)
    {
        var notification = await _context.Notifications.FirstOrDefaultAsync(x => x.Id == notificationId && x.UserId == userId);
        if (notification is null) throw new KeyNotFoundException("Không tìm thấy thông báo.");
        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        var now = DateTimeOffset.UtcNow;
        await _context.Notifications
            .Where(x => x.UserId == userId && !x.IsRead)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.IsRead, true).SetProperty(x => x.ReadAt, now));
    }

    public async Task DeleteAllAsync(Guid userId)
    {
        await _context.Notifications
            .Where(x => x.UserId == userId)
            .ExecuteDeleteAsync();
    }

    public async Task RegisterDeviceAsync(Guid userId, string expoPushToken, string platform)
    {
        var token = expoPushToken.Trim();
        var hasValidPrefix = token.StartsWith("ExponentPushToken[") ||
            token.StartsWith("ExpoPushToken[");

        if (!hasValidPrefix || !token.EndsWith(']'))
        {
            throw new InvalidOperationException("Expo push token không hợp lệ.");
        }

        var item = await _context.DeviceTokens.FirstOrDefaultAsync(x => x.ExpoPushToken == token);
        if (item is null)
        {
            await _context.DeviceTokens.AddAsync(new DeviceToken
            {
                UserId = userId,
                ExpoPushToken = token,
                Platform = platform,
                IsActive = true,
                LastUsedAt = DateTimeOffset.UtcNow
            });
        }
        else
        {
            item.UserId = userId;
            item.Platform = platform;
            item.IsActive = true;
            item.LastUsedAt = DateTimeOffset.UtcNow;
            item.UpdatedAt = DateTimeOffset.UtcNow;
        }
        await _context.SaveChangesAsync();
    }

    public async Task UnregisterDeviceAsync(Guid userId, string expoPushToken)
    {
        var item = await _context.DeviceTokens.FirstOrDefaultAsync(
            x => x.UserId == userId && x.ExpoPushToken == expoPushToken);

        if (item is null)
        {
            return;
        }

        item.IsActive = false;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();
    }

    private async Task<string?> ActorName(Guid? actorId)
    {
        if (!actorId.HasValue)
        {
            return null;
        }

        return await _context.Users
            .Where(x => x.Id == actorId.Value)
            .Select(x => x.DisplayName)
            .FirstOrDefaultAsync();
    }

    private static string GetMessage(NotificationType type, string? actorName)
    {
        var name = string.IsNullOrWhiteSpace(actorName) ? "Một người dùng" : actorName;
        return type switch
        {
            NotificationType.Follow => $"{name} đã theo dõi bạn.",
            NotificationType.PostReaction => $"{name} đã thả cảm xúc vào bài viết của bạn.",
            NotificationType.Comment => $"{name} đã bình luận bài viết của bạn.",
            NotificationType.CommentReply => $"{name} đã trả lời bình luận của bạn.",
            NotificationType.GroupJoinApproved => "Yêu cầu tham gia nhóm của bạn đã được duyệt.",
            NotificationType.GroupJoinRejected => "Yêu cầu tham gia nhóm của bạn đã bị từ chối.",
            NotificationType.CopyrightReviewPending => "Nội dung của bạn đang được kiểm tra bản quyền.",
            NotificationType.CopyrightConfirmed => "Nội dung của bạn đã bị xác nhận vi phạm bản quyền.",
            NotificationType.CopyrightDismissed => "Hồ sơ bản quyền đã được bác bỏ và nội dung hợp lệ được khôi phục.",
            NotificationType.CopyrightAppealResolved => "Kháng nghị bản quyền của bạn đã có kết quả.",
            NotificationType.CopyrightScanResolved => "Lượt quét bản quyền nội dung của bạn đã có kết quả.",
            NotificationType.GroupPostReviewPending => "Bài viết của bạn đã được gửi vào hàng đợi duyệt của nhóm.",
            NotificationType.GroupPostApproved => $"{name} đã duyệt bài viết của bạn trong nhóm.",
            NotificationType.GroupPostRejected => $"{name} đã từ chối bài viết của bạn trong nhóm.",
            _ => "Bạn có thông báo mới."
        };
    }

    private static string? Preview(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "Bài viết không có nội dung chữ.";
        }

        var text = value.Trim();
        return text.Length <= 120 ? text : $"{text[..120]}…";
    }

    private static (DateTimeOffset? CreatedAt, Guid? Id) DecodeCursor(string? cursor)
    {
        if (string.IsNullOrWhiteSpace(cursor))
        {
            return (null, null);
        }

        try
        {
            var parts = Encoding.UTF8.GetString(Convert.FromBase64String(cursor)).Split('|', 2);

            if (parts.Length != 2)
            {
                throw new InvalidOperationException("Cursor không hợp lệ.");
            }

            var hasValidDate = DateTimeOffset.TryParseExact(
                parts[0],
                "O",
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out var createdAt);
            var hasValidId = Guid.TryParse(parts[1], out var id);

            if (!hasValidDate || !hasValidId)
            {
                throw new InvalidOperationException("Cursor không hợp lệ.");
            }

            return (createdAt, id);
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("Cursor không hợp lệ.");
        }
    }

    private static string EncodeCursor(DateTimeOffset createdAt, Guid id) =>
        Convert.ToBase64String(Encoding.UTF8.GetBytes($"{createdAt:O}|{id:D}"));
}
