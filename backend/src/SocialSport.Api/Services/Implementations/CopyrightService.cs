using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.DTOs.Common;
using SocialSport.Api.DTOs.Copyright;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Services.Interfaces;
using SocialSport.Api.Settings;
using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.StaticFiles;

namespace SocialSport.Api.Services.Implementations;

public class CopyrightService : ICopyrightService
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IMediaUrlService _mediaUrlService;
    private readonly CopyrightScanningSettings _settings;
    private readonly INotificationService _notificationService;

    public CopyrightService(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        IMediaUrlService mediaUrlService,
        IOptions<CopyrightScanningSettings> settings,
        INotificationService notificationService)
    {
        _context = context;
        _environment = environment;
        _mediaUrlService = mediaUrlService;
        _settings = settings.Value;
        _notificationService = notificationService;
    }

    public async Task<string> ComputeHashAsync(string path)
    {
        await using var stream = File.OpenRead(path);
        return Convert.ToHexString(await SHA256.HashDataAsync(stream))
            .ToLowerInvariant();
    }

    public async Task<bool> EvaluateUploadAsync(
        Guid uploaderId,
        Post post,
        PostMedia media)
    {
        if (string.IsNullOrWhiteSpace(media.ContentHash))
        {
            return false;
        }

        var assets = await _context.CopyrightAssets
            .Where(x =>
                x.Status == CopyrightAssetStatus.Active
                && x.MediaType == media.MediaType
                && x.ContentHash == media.ContentHash
                && x.CreatedByUserId != uploaderId
                && !_context.CopyrightCases.Any(c =>
                    c.CopyrightAssetId == x.Id
                    && c.PostMediaId == media.Id))
            .ToListAsync();

        Guid? firstCaseId = null;
        foreach (var asset in assets)
        {
            var copyrightCase = new CopyrightCase
            {
                Id = Guid.NewGuid(),
                CopyrightAssetId = asset.Id,
                PostMediaId = media.Id,
                UploaderId = uploaderId,
                Confidence = 1m,
                Status = CopyrightCaseStatus.Pending,
                CreatedAt = DateTimeOffset.UtcNow
            };
            firstCaseId ??= copyrightCase.Id;
            await _context.CopyrightCases.AddAsync(copyrightCase);
        }

        if (assets.Count == 0)
        {
            return false;
        }

        post.Status = PostStatus.Hidden;
        post.UpdatedAt = DateTimeOffset.UtcNow;
        await _notificationService.CreateAsync(
            uploaderId,
            null,
            NotificationType.CopyrightReviewPending,
            firstCaseId);
        return true;
    }

    public async Task<CopyrightAsset> CreateAssetAsync(
        Guid adminId,
        string title,
        string rightsOwnerName,
        string? evidenceNotes,
        IFormFile file)
    {
        if (string.IsNullOrWhiteSpace(title)
            || string.IsNullOrWhiteSpace(rightsOwnerName)
            || file.Length == 0
            || file.Length > 200 * 1024 * 1024)
        {
            throw new InvalidOperationException("Thông tin hoặc file reference không hợp lệ.");
        }

        var mediaType = file.ContentType.StartsWith("image/")
            ? MediaType.Image
            : file.ContentType.StartsWith("video/")
                ? MediaType.Video
                : throw new InvalidOperationException("Reference chỉ hỗ trợ ảnh hoặc video.");

        var folder = Path.Combine(
            _environment.ContentRootPath,
            "App_Data",
            "copyright-references");
        Directory.CreateDirectory(folder);

        var fileName =
            $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName).ToLowerInvariant()}";
        var path = Path.Combine(folder, fileName);
        await using (var stream = new FileStream(path, FileMode.CreateNew))
        {
            await file.CopyToAsync(stream);
        }

        var asset = new CopyrightAsset
        {
            Id = Guid.NewGuid(),
            CreatedByUserId = adminId,
            Title = title.Trim(),
            RightsOwnerName = rightsOwnerName.Trim(),
            EvidenceNotes = evidenceNotes?.Trim(),
            ContentHash = await ComputeHashAsync(path),
            MediaType = mediaType,
            ReferencePath = fileName,
            Status = CopyrightAssetStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };
        await _context.CopyrightAssets.AddAsync(asset);
        await _context.SaveChangesAsync();
        return asset;
    }

    public async Task<(string Path, string ContentType)> GetAssetMediaAsync(
        Guid assetId)
    {
        var referencePath = await _context.CopyrightAssets
            .AsNoTracking()
            .Where(x => x.Id == assetId && x.Status == CopyrightAssetStatus.Active)
            .Select(x => x.ReferencePath)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Không tìm thấy reference bản quyền.");
        var root = Path.GetFullPath(Path.Combine(
            _environment.ContentRootPath,
            "App_Data",
            "copyright-references"));
        var candidate = Path.IsPathRooted(referencePath)
            ? Path.GetFullPath(referencePath)
            : Path.GetFullPath(Path.Combine(root, referencePath));
        var rootPrefix = root.EndsWith(Path.DirectorySeparatorChar)
            ? root
            : $"{root}{Path.DirectorySeparatorChar}";
        if (!candidate.StartsWith(rootPrefix, StringComparison.OrdinalIgnoreCase)
            || !File.Exists(candidate))
        {
            throw new KeyNotFoundException("File reference không còn khả dụng.");
        }

        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(candidate, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        return (candidate, contentType);
    }

    public async Task<(string Path, string ContentType)> GetCaseMediaAsync(
        Guid caseId)
    {
        var mediaUrl = await _context.CopyrightCases
            .AsNoTracking()
            .Where(x => x.Id == caseId)
            .Select(x => x.PostMedia.Url)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Không tìm thấy media cần review.");
        const string prefix = "/uploads/posts/";
        if (!mediaUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new KeyNotFoundException("Đường dẫn media không hợp lệ.");
        }

        var webRoot = _environment.WebRootPath
            ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var root = Path.GetFullPath(Path.Combine(webRoot, "uploads", "posts"));
        var candidate = Path.GetFullPath(Path.Combine(root, Path.GetFileName(mediaUrl)));
        if (!candidate.StartsWith(
                $"{root}{Path.DirectorySeparatorChar}",
                StringComparison.OrdinalIgnoreCase)
            || !File.Exists(candidate))
        {
            throw new KeyNotFoundException("File media không còn khả dụng.");
        }

        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(candidate, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        return (candidate, contentType);
    }

    public async Task<PagedResponse<CopyrightCaseDto>> GetCasesAsync(
        int page,
        int pageSize,
        CopyrightCaseStatus? status)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.CopyrightCases
            .AsNoTracking()
            .Include(x => x.CopyrightAsset)
            .Include(x => x.PostMedia)
            .AsQueryable();
        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status);
        }

        var total = await query.CountAsync();
        var cases = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return new PagedResponse<CopyrightCaseDto>
        {
            Items = cases.Select(ToDto).ToList(),
            Page = page,
            PageSize = pageSize,
            Total = total
        };
    }

    public async Task<List<CopyrightCaseDto>> GetMineAsync(Guid userId)
    {
        var cases = await _context.CopyrightCases
            .AsNoTracking()
            .Include(x => x.CopyrightAsset)
            .Include(x => x.PostMedia)
            .Where(x => x.UploaderId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .ToListAsync();
        return cases.Select(ToDto).ToList();
    }

    public async Task DecideAsync(
        Guid adminId,
        Guid caseId,
        CopyrightDecisionRequest request)
    {
        if (request.Status is not (
            CopyrightCaseStatus.Confirmed
            or CopyrightCaseStatus.Dismissed
            or CopyrightCaseStatus.AppealAccepted
            or CopyrightCaseStatus.AppealRejected))
        {
            throw new InvalidOperationException("Quyết định bản quyền không hợp lệ.");
        }

        var item = await _context.CopyrightCases
            .Include(x => x.PostMedia)
            .ThenInclude(x => x.Post)
            .FirstOrDefaultAsync(x => x.Id == caseId)
            ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ bản quyền.");
        var allowed = item.Status switch
        {
            CopyrightCaseStatus.Pending => request.Status is
                CopyrightCaseStatus.Confirmed or CopyrightCaseStatus.Dismissed,
            CopyrightCaseStatus.Appealed => request.Status is
                CopyrightCaseStatus.AppealAccepted or CopyrightCaseStatus.AppealRejected,
            _ => false
        };
        if (!allowed)
        {
            throw new InvalidOperationException(
                "Trạng thái hồ sơ không cho phép quyết định này.");
        }

        item.Status = request.Status;
        item.DecisionNotes = request.Notes.Trim();
        item.ReviewedBy = adminId;
        item.ReviewedAt = DateTimeOffset.UtcNow;

        if (request.Status is CopyrightCaseStatus.Dismissed
            or CopyrightCaseStatus.AppealAccepted)
        {
            var hasOtherBlockingCase = await _context.CopyrightCases.AnyAsync(x =>
                x.Id != item.Id
                && x.PostMedia.PostId == item.PostMedia.PostId
                && x.Status != CopyrightCaseStatus.Dismissed
                && x.Status != CopyrightCaseStatus.AppealAccepted);
            if (!hasOtherBlockingCase)
            {
                item.PostMedia.Post.Status = PostStatus.Published;
            }
        }
        else if (request.Status is CopyrightCaseStatus.Confirmed
            or CopyrightCaseStatus.AppealRejected)
        {
            item.PostMedia.Post.Status = PostStatus.Removed;
        }

        item.PostMedia.Post.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();
        var notificationType = request.Status switch
        {
            CopyrightCaseStatus.Confirmed => NotificationType.CopyrightConfirmed,
            CopyrightCaseStatus.Dismissed => NotificationType.CopyrightDismissed,
            _ => NotificationType.CopyrightAppealResolved
        };
        await _notificationService.CreateAsync(
            item.UploaderId,
            null,
            notificationType,
            item.Id);
    }

    public async Task AppealAsync(
        Guid userId,
        Guid caseId,
        CopyrightAppealRequest request)
    {
        var item = await _context.CopyrightCases
            .FirstOrDefaultAsync(x => x.Id == caseId && x.UploaderId == userId)
            ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ bản quyền.");
        if (item.Status != CopyrightCaseStatus.Confirmed)
        {
            throw new InvalidOperationException(
                "Chỉ quyết định vi phạm đã xác nhận mới có thể kháng nghị.");
        }

        var appealDeadline = item.ReviewedAt?.AddDays(_settings.AppealWindowDays);
        if (!appealDeadline.HasValue || appealDeadline.Value < DateTimeOffset.UtcNow)
        {
            throw new InvalidOperationException(
                $"Thời hạn kháng nghị {_settings.AppealWindowDays} ngày đã hết.");
        }

        item.Status = CopyrightCaseStatus.Appealed;
        item.AppealReason = request.Reason.Trim();
        item.AppealedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();
    }

    private CopyrightCaseDto ToDto(CopyrightCase item)
    {
        return new CopyrightCaseDto
        {
            Id = item.Id,
            PostId = item.PostMedia.PostId,
            PostMediaId = item.PostMediaId,
            MediaUrl = $"/api/v1/copyright/cases/{item.Id}/media",
            MediaType = item.PostMedia.MediaType,
            ReferenceMediaUrl = $"/api/v1/copyright/assets/{item.CopyrightAssetId}/media",
            CopyrightAssetId = item.CopyrightAssetId,
            AssetTitle = item.CopyrightAsset.Title,
            RightsOwnerName = item.CopyrightAsset.RightsOwnerName,
            UploaderId = item.UploaderId,
            Confidence = item.Confidence,
            Status = item.Status,
            DecisionNotes = item.DecisionNotes,
            AppealReason = item.AppealReason,
            CreatedAt = item.CreatedAt,
            ReviewedAt = item.ReviewedAt,
            AppealedAt = item.AppealedAt,
            AppealDeadline = item.ReviewedAt?.AddDays(_settings.AppealWindowDays),
            CanAppeal = item.Status == CopyrightCaseStatus.Confirmed
                && item.ReviewedAt.HasValue
                && item.ReviewedAt.Value.AddDays(_settings.AppealWindowDays)
                    >= DateTimeOffset.UtcNow
        };
    }
}
