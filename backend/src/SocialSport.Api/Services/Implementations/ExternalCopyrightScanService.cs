using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.StaticFiles;
using SocialSport.Api.Data;
using SocialSport.Api.DTOs.Common;
using SocialSport.Api.DTOs.Copyright;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Services.Interfaces;
using SocialSport.Api.Settings;

namespace SocialSport.Api.Services.Implementations;

public class ExternalCopyrightScanService : IExternalCopyrightScanService
{
    private const string AcrCloudProvider = "AcrCloud";
    private readonly ApplicationDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMediaUrlService _mediaUrlService;
    private readonly IWebHostEnvironment _environment;
    private readonly CopyrightScanningSettings _settings;
    private readonly ILogger<ExternalCopyrightScanService> _logger;
    private readonly INotificationService _notificationService;

    public ExternalCopyrightScanService(
        ApplicationDbContext context,
        IHttpClientFactory httpClientFactory,
        IMediaUrlService mediaUrlService,
        IWebHostEnvironment environment,
        IOptions<CopyrightScanningSettings> settings,
        ILogger<ExternalCopyrightScanService> logger,
        INotificationService notificationService)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _mediaUrlService = mediaUrlService;
        _environment = environment;
        _settings = settings.Value;
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task<ExternalCopyrightScan?> SubmitAsync(
        Post post,
        PostMedia media,
        string filePath,
        string contentType,
        bool replaceExisting = false,
        CancellationToken cancellationToken = default)
    {
        if (!_settings.Enabled || media.MediaType != MediaType.Video)
        {
            return null;
        }

        EnsureConfigured();
        var existing = await _context.ExternalCopyrightScans
            .FirstOrDefaultAsync(
                x => x.PostMediaId == media.Id && x.Provider == AcrCloudProvider,
                cancellationToken);
        if (existing is not null)
        {
            if (!replaceExisting)
            {
                return existing;
            }

            _context.ExternalCopyrightScans.Remove(existing);
            await _context.SaveChangesAsync(cancellationToken);
        }

        var scan = new ExternalCopyrightScan
        {
            Id = Guid.NewGuid(),
            PostMediaId = media.Id,
            Provider = AcrCloudProvider,
            Status = ExternalCopyrightScanStatus.Processing,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _context.ExternalCopyrightScans.Add(scan);

        if (_settings.FailClosed)
        {
            post.Status = PostStatus.Hidden;
            post.UpdatedAt = DateTimeOffset.UtcNow;
        }

        try
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"api/fs-containers/{Uri.EscapeDataString(_settings.ContainerId)}/files");
            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", _settings.BearerToken);
            request.Headers.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));

            await using var stream = File.OpenRead(filePath);
            using var content = new MultipartFormDataContent();
            using var fileContent = new StreamContent(stream);
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
            content.Add(fileContent, "file", Path.GetFileName(filePath));
            content.Add(new StringContent("audio"), "data_type");
            content.Add(new StringContent(media.Id.ToString()), "name");
            request.Content = content;

            var client = _httpClientFactory.CreateClient("AcrCloud");
            using var response = await client.SendAsync(request, cancellationToken);
            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException(
                    $"ACRCloud trả về HTTP {(int)response.StatusCode}.");
            }

            using var document = JsonDocument.Parse(json);
            scan.ExternalJobId = ReadStringOrNumber(
                document.RootElement.GetProperty("data"),
                "id");
            if (string.IsNullOrWhiteSpace(scan.ExternalJobId))
            {
                throw new InvalidOperationException(
                    "ACRCloud không trả về mã công việc quét.");
            }
        }
        catch (Exception exception)
        {
            scan.Status = ExternalCopyrightScanStatus.Failed;
            scan.ErrorMessage = SafeError(exception.Message);
            _logger.LogWarning(
                exception,
                "Could not submit media {MediaId} to ACRCloud.",
                media.Id);
        }

        scan.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return scan;
    }

    public async Task<PagedResponse<ExternalCopyrightScanDto>> GetScansAsync(
        int page,
        int pageSize,
        ExternalCopyrightScanStatus? status)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _context.ExternalCopyrightScans
            .AsNoTracking()
            .Include(x => x.PostMedia)
            .ThenInclude(x => x.Post)
            .AsQueryable();
        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return new PagedResponse<ExternalCopyrightScanDto>
        {
            Items = items.Select(ToDto).ToList(),
            Page = page,
            PageSize = pageSize,
            Total = total
        };
    }

    public async Task<List<ExternalCopyrightScanDto>> GetMineAsync(Guid userId)
    {
        var items = await _context.ExternalCopyrightScans
            .AsNoTracking()
            .Include(x => x.PostMedia)
            .ThenInclude(x => x.Post)
            .Where(x => x.PostMedia.Post.AuthorId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .ToListAsync();
        return items.Select(ToDto).ToList();
    }

    public async Task<(string Path, string ContentType)> GetMediaAsync(Guid scanId)
    {
        var mediaUrl = await _context.ExternalCopyrightScans
            .AsNoTracking()
            .Where(x => x.Id == scanId)
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

    public async Task<ExternalCopyrightScanDto> RefreshAsync(
        Guid scanId,
        CancellationToken cancellationToken = default)
    {
        var scan = await _context.ExternalCopyrightScans
            .Include(x => x.PostMedia)
            .ThenInclude(x => x.Post)
            .FirstOrDefaultAsync(x => x.Id == scanId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt quét bản quyền.");
        if (scan.Status != ExternalCopyrightScanStatus.Processing)
        {
            return ToDto(scan);
        }

        EnsureConfigured();
        if (string.IsNullOrWhiteSpace(scan.ExternalJobId))
        {
            throw new InvalidOperationException("Lượt quét chưa có mã từ nhà cung cấp.");
        }

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"api/fs-containers/{Uri.EscapeDataString(_settings.ContainerId)}/files/" +
            Uri.EscapeDataString(scan.ExternalJobId));
        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", _settings.BearerToken);
        request.Headers.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));

        var client = _httpClientFactory.CreateClient("AcrCloud");
        using var response = await client.SendAsync(request, cancellationToken);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"ACRCloud trả về HTTP {(int)response.StatusCode}.");
        }

        var previousStatus = scan.Status;
        ApplyProviderResult(scan, json);
        scan.UpdatedAt = DateTimeOffset.UtcNow;
        if (scan.Status == ExternalCopyrightScanStatus.Clear)
        {
            await RestorePostWhenUnblockedAsync(scan);
        }
        else if (scan.Status == ExternalCopyrightScanStatus.ReviewRequired)
        {
            scan.PostMedia.Post.Status = PostStatus.Hidden;
            scan.PostMedia.Post.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        if (previousStatus != scan.Status
            && scan.Status == ExternalCopyrightScanStatus.Clear)
        {
            await _notificationService.CreateAsync(
                scan.PostMedia.Post.AuthorId,
                null,
                NotificationType.CopyrightScanResolved,
                scan.Id);
        }

        return ToDto(scan);
    }

    public async Task DecideAsync(
        Guid adminId,
        Guid scanId,
        ExternalCopyrightScanDecisionRequest request)
    {
        var scan = await _context.ExternalCopyrightScans
            .Include(x => x.PostMedia)
            .ThenInclude(x => x.Post)
            .FirstOrDefaultAsync(x => x.Id == scanId)
            ?? throw new KeyNotFoundException("Không tìm thấy lượt quét bản quyền.");
        if (scan.Status is not (
            ExternalCopyrightScanStatus.ReviewRequired
            or ExternalCopyrightScanStatus.Failed))
        {
            throw new InvalidOperationException(
                "Chỉ kết quả cần review hoặc quét lỗi mới được Admin quyết định.");
        }

        scan.Status = request.IsViolation
            ? ExternalCopyrightScanStatus.ViolationConfirmed
            : ExternalCopyrightScanStatus.ClearedByAdmin;
        scan.ReviewedBy = adminId;
        scan.ReviewedAt = DateTimeOffset.UtcNow;
        scan.ReviewNotes = request.Notes.Trim();
        scan.UpdatedAt = DateTimeOffset.UtcNow;
        scan.PostMedia.Post.UpdatedAt = DateTimeOffset.UtcNow;

        if (request.IsViolation)
        {
            scan.PostMedia.Post.Status = PostStatus.Removed;
        }
        else
        {
            await RestorePostWhenUnblockedAsync(scan);
        }

        await _context.SaveChangesAsync();
        await _notificationService.CreateAsync(
            scan.PostMedia.Post.AuthorId,
            null,
            NotificationType.CopyrightScanResolved,
            scan.Id);
    }

    private void EnsureConfigured()
    {
        if (!string.Equals(
                _settings.Provider,
                AcrCloudProvider,
                StringComparison.OrdinalIgnoreCase)
            || string.IsNullOrWhiteSpace(_settings.ApiBaseUrl)
            || string.IsNullOrWhiteSpace(_settings.BearerToken)
            || string.IsNullOrWhiteSpace(_settings.ContainerId))
        {
            throw new InvalidOperationException(
                "CopyrightScanning chưa được cấu hình đầy đủ cho ACRCloud.");
        }
    }

    private void ApplyProviderResult(ExternalCopyrightScan scan, string json)
    {
        using var document = JsonDocument.Parse(json);
        var data = document.RootElement.GetProperty("data");
        if (data.ValueKind == JsonValueKind.Array)
        {
            data = data.EnumerateArray().FirstOrDefault();
        }

        var state = data.GetProperty("state").GetInt32();
        scan.ProviderResultJson = json;
        scan.ErrorMessage = null;
        if (state == 0)
        {
            scan.Status = ExternalCopyrightScanStatus.Processing;
            return;
        }

        if (state == -1)
        {
            scan.Status = ExternalCopyrightScanStatus.Clear;
            scan.MatchSummary = null;
            return;
        }

        if (state is -2 or -3)
        {
            scan.Status = ExternalCopyrightScanStatus.Failed;
            scan.ErrorMessage = "Nhà cung cấp không thể xử lý file này.";
            return;
        }

        scan.Status = ExternalCopyrightScanStatus.ReviewRequired;
        scan.MatchSummary = BuildMatchSummary(data);
    }

    private async Task RestorePostWhenUnblockedAsync(ExternalCopyrightScan scan)
    {
        var post = scan.PostMedia.Post;
        var hasCopyrightCase = await _context.CopyrightCases.AnyAsync(x =>
            x.PostMedia.PostId == post.Id
            && x.Status != CopyrightCaseStatus.Dismissed
            && x.Status != CopyrightCaseStatus.AppealAccepted);
        var hasOtherScan = await _context.ExternalCopyrightScans.AnyAsync(x =>
            x.Id != scan.Id
            && x.PostMedia.PostId == post.Id
            && x.Status != ExternalCopyrightScanStatus.Clear
            && x.Status != ExternalCopyrightScanStatus.ClearedByAdmin);
        if (!hasCopyrightCase && !hasOtherScan && post.Status == PostStatus.Hidden)
        {
            post.Status = PostStatus.Published;
            post.UpdatedAt = DateTimeOffset.UtcNow;
        }
    }

    private ExternalCopyrightScanDto ToDto(ExternalCopyrightScan scan)
    {
        return new ExternalCopyrightScanDto
        {
            Id = scan.Id,
            PostId = scan.PostMedia.PostId,
            PostMediaId = scan.PostMediaId,
            UploaderId = scan.PostMedia.Post.AuthorId,
            MediaUrl = _mediaUrlService.CreatePostMediaUrl(scan.PostMediaId),
            Provider = scan.Provider,
            Status = scan.Status,
            MatchSummary = scan.MatchSummary,
            ErrorMessage = scan.ErrorMessage,
            ReviewNotes = scan.ReviewNotes,
            CreatedAt = scan.CreatedAt,
            UpdatedAt = scan.UpdatedAt
        };
    }

    private static string BuildMatchSummary(JsonElement data)
    {
        if (!data.TryGetProperty("results", out var results))
        {
            return "ACRCloud báo có kết quả khớp; cần Admin kiểm tra.";
        }

        foreach (var key in new[] { "music", "cover_songs", "custom_files" })
        {
            if (results.TryGetProperty(key, out var matches)
                && matches.ValueKind == JsonValueKind.Array
                && matches.GetArrayLength() > 0)
            {
                return $"ACRCloud phát hiện {matches.GetArrayLength()} kết quả trong {key}.";
            }
        }

        return "ACRCloud báo có kết quả khớp; cần Admin kiểm tra.";
    }

    private static string? ReadStringOrNumber(JsonElement element, string property)
    {
        if (!element.TryGetProperty(property, out var value))
        {
            return null;
        }

        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => value.GetRawText(),
            _ => null
        };
    }

    private static string SafeError(string message)
    {
        return message.Length <= 2000 ? message : message[..2000];
    }
}
