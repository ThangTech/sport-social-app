using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.DTOs.Report;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Services.Interfaces;

namespace SocialSport.Api.Services.Implementations;

public class ReportService : IReportService
{
    private static readonly HashSet<string> AllowedReasons = new(StringComparer.OrdinalIgnoreCase)
    { "spam", "harassment", "hate", "violence", "sexual", "impersonation", "other" };
    private readonly ApplicationDbContext _context;
    private readonly IPostAccessService _postAccessService;

    public ReportService(ApplicationDbContext context, IPostAccessService postAccessService)
    {
        _context = context;
        _postAccessService = postAccessService;
    }

    public async Task<ReportDto> CreateAsync(Guid reporterId, CreateReportRequest request)
    {
        var reason = request.Reason.Trim().ToLowerInvariant();
        var description = request.Description?.Trim();
        if (!Enum.IsDefined(request.TargetType) || !AllowedReasons.Contains(reason))
            throw new InvalidOperationException("Loại nội dung hoặc lý do báo cáo không hợp lệ.");
        if (reason == "other" && string.IsNullOrWhiteSpace(description))
            throw new InvalidOperationException("Vui lòng mô tả lý do báo cáo.");

        await EnsureTargetVisibleAsync(reporterId, request.TargetType, request.TargetId);
        var duplicate = await _context.Reports.AnyAsync(x => x.ReporterId == reporterId && x.TargetType == request.TargetType && x.TargetId == request.TargetId && (x.Status == ReportStatus.Pending || x.Status == ReportStatus.Reviewing));
        if (duplicate) throw new InvalidOperationException("Bạn đã có báo cáo đang được xử lý cho nội dung này.");
        var since = DateTimeOffset.UtcNow.AddHours(-24);
        if (await _context.Reports.CountAsync(x => x.ReporterId == reporterId && x.CreatedAt >= since) >= 10)
            throw new InvalidOperationException("Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau.");

        var report = new Report
        {
            Id = Guid.NewGuid(), ReporterId = reporterId, TargetType = request.TargetType,
            TargetId = request.TargetId, Reason = reason, Description = description,
            Status = ReportStatus.Pending, CreatedAt = DateTimeOffset.UtcNow
        };
        await _context.Reports.AddAsync(report);
        await _context.SaveChangesAsync();
        return ToDto(report);
    }

    public async Task<List<ReportDto>> GetMineAsync(Guid reporterId) =>
        (await _context.Reports.AsNoTracking().Where(x => x.ReporterId == reporterId).OrderByDescending(x => x.CreatedAt).Take(100).ToListAsync()).Select(ToDto).ToList();

    private async Task EnsureTargetVisibleAsync(Guid userId, ReportTargetType type, Guid targetId)
    {
        switch (type)
        {
            case ReportTargetType.User:
                if (!await _context.Users.AnyAsync(x => x.Id == targetId && x.Status == UserStatus.Active) || targetId == userId) throw new KeyNotFoundException("Không tìm thấy người dùng để báo cáo.");
                break;
            case ReportTargetType.Post:
                var post = await _context.Posts.Include(x => x.Group).FirstOrDefaultAsync(x => x.Id == targetId && x.Status == PostStatus.Published);
                if (post is null || !await _postAccessService.CanViewAsync(userId, post) || post.AuthorId == userId) throw new KeyNotFoundException("Không tìm thấy bài viết để báo cáo.");
                break;
            case ReportTargetType.Comment:
                var comment = await _context.Comments.FirstOrDefaultAsync(x => x.Id == targetId && x.Status == CommentStatus.Published);
                if (comment is null || comment.AuthorId == userId) throw new KeyNotFoundException("Không tìm thấy bình luận để báo cáo.");
                var commentPost = await _context.Posts.FirstOrDefaultAsync(x => x.Id == comment.PostId);
                if (commentPost is null || !await _postAccessService.CanViewAsync(userId, commentPost)) throw new KeyNotFoundException("Không tìm thấy bình luận để báo cáo.");
                break;
            case ReportTargetType.Group:
                if (!await _context.Groups.AnyAsync(x => x.Id == targetId && x.Status == GroupStatus.Active && x.OwnerId != userId)) throw new KeyNotFoundException("Không tìm thấy nhóm để báo cáo.");
                break;
        }
    }

    private static ReportDto ToDto(Report x) => new() { Id = x.Id, TargetType = x.TargetType, TargetId = x.TargetId, Reason = x.Reason, Description = x.Description, Status = x.Status, CreatedAt = x.CreatedAt, ReviewedAt = x.ReviewedAt };
}
