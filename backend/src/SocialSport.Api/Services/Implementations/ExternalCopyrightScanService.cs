using System.Globalization;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
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
    private const string GoogleVisionProvider = "GoogleVision";
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
        var provider = ResolveProvider(media.MediaType);
        if (provider is null)
        {
            return null;
        }

        var existing = await _context.ExternalCopyrightScans
            .FirstOrDefaultAsync(
                item => item.PostMediaId == media.Id
                    && item.Provider == provider,
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
            PostMedia = media,
            Provider = provider,
            Status = ExternalCopyrightScanStatus.Processing,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _context.ExternalCopyrightScans.Add(scan);

        await RunProviderAsync(
            scan,
            filePath,
            contentType,
            cancellationToken);
        await ApplyAutomatedOutcomeAsync(scan, post, cancellationToken);
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
            .Include(item => item.PostMedia)
            .ThenInclude(media => media.Post)
            .AsQueryable();
        if (status.HasValue)
        {
            query = query.Where(item => item.Status == status.Value);
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(item => item.CreatedAt)
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
            .Include(item => item.PostMedia)
            .ThenInclude(media => media.Post)
            .Where(item => item.PostMedia.Post.AuthorId == userId)
            .OrderByDescending(item => item.CreatedAt)
            .Take(100)
            .ToListAsync();
        return items.Select(ToDto).ToList();
    }

    public async Task<(string Path, string ContentType)> GetMediaAsync(
        Guid scanId)
    {
        var mediaUrl = await _context.ExternalCopyrightScans
            .AsNoTracking()
            .Where(item => item.Id == scanId)
            .Select(item => item.PostMedia.Url)
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException(
                "Không tìm thấy media cần review.");
        var path = ResolveMediaPath(mediaUrl);
        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(path, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        return (path, contentType);
    }

    public async Task<ExternalCopyrightScanDto> RefreshAsync(
        Guid scanId,
        CancellationToken cancellationToken = default)
    {
        var scan = await _context.ExternalCopyrightScans
            .Include(item => item.PostMedia)
            .ThenInclude(media => media.Post)
            .FirstOrDefaultAsync(item => item.Id == scanId, cancellationToken)
            ?? throw new KeyNotFoundException(
                "Không tìm thấy lượt quét bản quyền.");

        var path = ResolveMediaPath(scan.PostMedia.Url);
        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(path, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        scan.Status = ExternalCopyrightScanStatus.Processing;
        scan.ErrorMessage = null;
        scan.MatchSummary = null;
        scan.ProviderResultJson = null;
        await RunProviderAsync(
            scan,
            path,
            contentType,
            cancellationToken);
        await ApplyAutomatedOutcomeAsync(
            scan,
            scan.PostMedia.Post,
            cancellationToken);
        scan.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return ToDto(scan);
    }

    public async Task DecideAsync(
        Guid adminId,
        Guid scanId,
        ExternalCopyrightScanDecisionRequest request)
    {
        var scan = await _context.ExternalCopyrightScans
            .Include(item => item.PostMedia)
            .ThenInclude(media => media.Post)
            .FirstOrDefaultAsync(item => item.Id == scanId)
            ?? throw new KeyNotFoundException(
                "Không tìm thấy lượt quét bản quyền.");
        var isAppealDecision = scan.Status ==
            ExternalCopyrightScanStatus.Appealed;
        if (!isAppealDecision
            && scan.Status is not (
                ExternalCopyrightScanStatus.ReviewRequired
                or ExternalCopyrightScanStatus.Failed))
        {
            throw new InvalidOperationException(
                "Trạng thái lượt quét không cho phép ra quyết định.");
        }

        scan.Status = isAppealDecision
            ? request.IsViolation
                ? ExternalCopyrightScanStatus.AppealRejected
                : ExternalCopyrightScanStatus.AppealAccepted
            : request.IsViolation
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
            isAppealDecision
                ? NotificationType.CopyrightAppealResolved
                : NotificationType.CopyrightScanResolved,
            scan.Id);
    }

    public async Task AppealAsync(
        Guid userId,
        Guid scanId,
        CopyrightAppealRequest request)
    {
        var scan = await _context.ExternalCopyrightScans
            .Include(item => item.PostMedia)
            .ThenInclude(media => media.Post)
            .FirstOrDefaultAsync(item =>
                item.Id == scanId
                && item.PostMedia.Post.AuthorId == userId)
            ?? throw new KeyNotFoundException(
                "Không tìm thấy kết quả quét bản quyền.");
        if (scan.Status != ExternalCopyrightScanStatus.ViolationConfirmed)
        {
            throw new InvalidOperationException(
                "Chỉ quyết định vi phạm đã xác nhận mới có thể kháng nghị.");
        }

        var deadline = scan.ReviewedAt?.AddDays(
            _settings.AppealWindowDays);
        if (!deadline.HasValue || deadline.Value < DateTimeOffset.UtcNow)
        {
            throw new InvalidOperationException(
                $"Thời hạn kháng nghị {_settings.AppealWindowDays} ngày đã hết.");
        }

        scan.Status = ExternalCopyrightScanStatus.Appealed;
        scan.AppealReason = request.Reason.Trim();
        scan.AppealedAt = DateTimeOffset.UtcNow;
        scan.UpdatedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();
    }

    private string? ResolveProvider(MediaType mediaType)
    {
        if (mediaType == MediaType.Video)
        {
            if (!_settings.AcrCloud.Enabled)
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(_settings.AcrCloud.Host)
                || string.IsNullOrWhiteSpace(_settings.AcrCloud.AccessKey)
                || string.IsNullOrWhiteSpace(_settings.AcrCloud.AccessSecret))
            {
                _logger.LogWarning(
                    "ACRCloud is enabled but credentials are incomplete.");
                return null;
            }

            return AcrCloudProvider;
        }

        if (mediaType == MediaType.Image)
        {
            if (!_settings.GoogleVision.Enabled)
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(_settings.GoogleVision.ApiKey))
            {
                _logger.LogWarning(
                    "Google Vision is enabled but its API key is missing.");
                return null;
            }

            return GoogleVisionProvider;
        }

        return null;
    }

    private async Task RunProviderAsync(
        ExternalCopyrightScan scan,
        string filePath,
        string contentType,
        CancellationToken cancellationToken)
    {
        try
        {
            if (scan.Provider == AcrCloudProvider)
            {
                await RunAcrCloudAsync(
                    scan,
                    filePath,
                    contentType,
                    cancellationToken);
            }
            else if (scan.Provider == GoogleVisionProvider)
            {
                await RunGoogleVisionAsync(
                    scan,
                    filePath,
                    cancellationToken);
            }
            else
            {
                throw new InvalidOperationException(
                    "Nhà cung cấp quét bản quyền không được hỗ trợ.");
            }
        }
        catch (Exception exception)
        {
            scan.Status = ExternalCopyrightScanStatus.Failed;
            scan.ErrorMessage = SafeError(exception.Message);
            _logger.LogWarning(
                exception,
                "Copyright provider {Provider} failed for media {MediaId}.",
                scan.Provider,
                scan.PostMediaId);
        }
    }

    private async Task RunAcrCloudAsync(
        ExternalCopyrightScan scan,
        string filePath,
        string contentType,
        CancellationToken cancellationToken)
    {
        var fileInfo = new FileInfo(filePath);
        if (fileInfo.Length > _settings.AcrCloud.MaxSampleBytes)
        {
            throw new InvalidOperationException(
                "Video vượt giới hạn mẫu ACRCloud 5 MB; Admin cần kiểm tra thủ công.");
        }

        const string method = "POST";
        const string path = "/v1/identify";
        const string dataType = "audio";
        const string signatureVersion = "1";
        var timestamp = DateTimeOffset.UtcNow
            .ToUnixTimeSeconds()
            .ToString(CultureInfo.InvariantCulture);
        var stringToSign = string.Join(
            "\n",
            method,
            path,
            _settings.AcrCloud.AccessKey,
            dataType,
            signatureVersion,
            timestamp);
        using var hmac = new HMACSHA1(
            Encoding.ASCII.GetBytes(_settings.AcrCloud.AccessSecret));
        var signature = Convert.ToBase64String(
            hmac.ComputeHash(Encoding.ASCII.GetBytes(stringToSign)));

        await using var stream = File.OpenRead(filePath);
        using var content = new MultipartFormDataContent();
        using var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        content.Add(fileContent, "sample", Path.GetFileName(filePath));
        content.Add(
            new StringContent(_settings.AcrCloud.AccessKey),
            "access_key");
        content.Add(
            new StringContent(fileInfo.Length.ToString(CultureInfo.InvariantCulture)),
            "sample_bytes");
        content.Add(new StringContent(timestamp), "timestamp");
        content.Add(new StringContent(signature), "signature");
        content.Add(new StringContent(dataType), "data_type");
        content.Add(
            new StringContent(signatureVersion),
            "signature_version");

        var client = _httpClientFactory.CreateClient("AcrCloud");
        using var response = await client.PostAsync(
            path.TrimStart('/'),
            content,
            cancellationToken);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"ACRCloud trả về HTTP {(int)response.StatusCode}.");
        }

        ApplyAcrCloudResult(scan, json);
    }

    private async Task RunGoogleVisionAsync(
        ExternalCopyrightScan scan,
        string filePath,
        CancellationToken cancellationToken)
    {
        var bytes = await File.ReadAllBytesAsync(filePath, cancellationToken);
        var payload = JsonSerializer.Serialize(new
        {
            requests = new[]
            {
                new
                {
                    image = new
                    {
                        content = Convert.ToBase64String(bytes)
                    },
                    features = new[]
                    {
                        new
                        {
                            type = "WEB_DETECTION",
                            maxResults = Math.Clamp(
                                _settings.GoogleVision.MaxResults,
                                1,
                                50)
                        }
                    }
                }
            }
        });
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            "v1/images:annotate");
        request.Headers.Add(
            "X-Goog-Api-Key",
            _settings.GoogleVision.ApiKey);
        request.Content = new StringContent(
            payload,
            Encoding.UTF8,
            "application/json");

        var client = _httpClientFactory.CreateClient("GoogleVision");
        using var response = await client.SendAsync(request, cancellationToken);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Google Vision trả về HTTP {(int)response.StatusCode}.");
        }

        ApplyGoogleVisionResult(scan, json);
    }

    private static void ApplyAcrCloudResult(
        ExternalCopyrightScan scan,
        string json)
    {
        using var document = JsonDocument.Parse(json);
        scan.ProviderResultJson = json;
        var root = document.RootElement;
        var status = root.GetProperty("status");
        var code = status.GetProperty("code").GetInt32();
        if (code == 1001)
        {
            scan.Status = ExternalCopyrightScanStatus.Clear;
            scan.MatchSummary = "ACRCloud không tìm thấy âm thanh trùng khớp.";
            return;
        }

        if (code != 0)
        {
            var message = status.TryGetProperty("msg", out var messageElement)
                ? messageElement.GetString()
                : "Không rõ nguyên nhân";
            throw new InvalidOperationException(
                $"ACRCloud không thể nhận diện mẫu: {message}.");
        }

        var matches = ReadAcrCloudMatches(root);
        scan.Status = matches.Count > 0
            ? ExternalCopyrightScanStatus.ReviewRequired
            : ExternalCopyrightScanStatus.Clear;
        scan.MatchSummary = matches.Count > 0
            ? $"ACRCloud phát hiện {matches.Count} kết quả: "
                + string.Join("; ", matches.Take(3))
            : "ACRCloud không tìm thấy âm thanh trùng khớp.";
    }

    private static List<string> ReadAcrCloudMatches(JsonElement root)
    {
        var matches = new List<string>();
        if (!root.TryGetProperty("metadata", out var metadata))
        {
            return matches;
        }

        foreach (var property in new[] { "music", "custom_files" })
        {
            if (!metadata.TryGetProperty(property, out var items)
                || items.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            foreach (var item in items.EnumerateArray())
            {
                var title = ReadString(item, "title") ?? "Không rõ tiêu đề";
                var artists = ReadArtistNames(item);
                var score = ReadStringOrNumber(item, "score");
                var description = string.IsNullOrWhiteSpace(artists)
                    ? title
                    : $"{title} - {artists}";
                if (!string.IsNullOrWhiteSpace(score))
                {
                    description += $" ({score}%)";
                }

                matches.Add(description);
            }
        }

        return matches;
    }

    private static void ApplyGoogleVisionResult(
        ExternalCopyrightScan scan,
        string json)
    {
        using var document = JsonDocument.Parse(json);
        scan.ProviderResultJson = json;
        var response = document.RootElement
            .GetProperty("responses")
            .EnumerateArray()
            .FirstOrDefault();
        if (response.ValueKind == JsonValueKind.Undefined)
        {
            throw new InvalidOperationException(
                "Google Vision không trả về kết quả.");
        }

        if (response.TryGetProperty("error", out var error))
        {
            var message = ReadString(error, "message")
                ?? "Không rõ nguyên nhân";
            throw new InvalidOperationException(
                $"Google Vision không thể phân tích ảnh: {message}");
        }

        if (!response.TryGetProperty("webDetection", out var detection))
        {
            scan.Status = ExternalCopyrightScanStatus.Clear;
            scan.MatchSummary = "Google Vision không tìm thấy tham chiếu web.";
            return;
        }

        var fullMatches = ArrayLength(detection, "fullMatchingImages");
        var partialMatches = ArrayLength(detection, "partialMatchingImages");
        var pages = ArrayLength(detection, "pagesWithMatchingImages");
        var totalSignals = fullMatches + partialMatches + pages;
        scan.Status = totalSignals > 0
            ? ExternalCopyrightScanStatus.ReviewRequired
            : ExternalCopyrightScanStatus.Clear;
        scan.MatchSummary = totalSignals > 0
            ? "Google Vision tìm thấy "
                + $"{fullMatches} ảnh trùng hoàn toàn, "
                + $"{partialMatches} ảnh trùng một phần và "
                + $"{pages} trang web liên quan. Admin cần xác minh quyền sở hữu."
            : "Google Vision không tìm thấy ảnh trùng trên web.";
    }

    private async Task ApplyAutomatedOutcomeAsync(
        ExternalCopyrightScan scan,
        Post post,
        CancellationToken cancellationToken)
    {
        if (scan.Status == ExternalCopyrightScanStatus.ReviewRequired)
        {
            post.Status = PostStatus.Hidden;
            post.UpdatedAt = DateTimeOffset.UtcNow;
            await _notificationService.CreateAsync(
                post.AuthorId,
                null,
                NotificationType.CopyrightReviewPending,
                scan.Id);
            return;
        }

        if (scan.Status == ExternalCopyrightScanStatus.Clear)
        {
            await RestorePostWhenUnblockedAsync(scan, cancellationToken);
        }
    }

    private async Task RestorePostWhenUnblockedAsync(
        ExternalCopyrightScan scan,
        CancellationToken cancellationToken = default)
    {
        var post = scan.PostMedia.Post;
        var hasCopyrightCase = await _context.CopyrightCases.AnyAsync(
            item => item.PostMedia.PostId == post.Id
                && item.Status != CopyrightCaseStatus.Dismissed
                && item.Status != CopyrightCaseStatus.AppealAccepted,
            cancellationToken);
        var hasOtherScan = await _context.ExternalCopyrightScans.AnyAsync(
            item => item.Id != scan.Id
                && item.PostMedia.PostId == post.Id
                && item.Status != ExternalCopyrightScanStatus.Clear
                && item.Status != ExternalCopyrightScanStatus.ClearedByAdmin
                && item.Status != ExternalCopyrightScanStatus.AppealAccepted
                && item.Status != ExternalCopyrightScanStatus.Failed,
            cancellationToken);
        if (!hasCopyrightCase
            && !hasOtherScan
            && post.Status == PostStatus.Hidden
            && post.GroupModerationStatus is
                GroupPostModerationStatus.NotApplicable
                or GroupPostModerationStatus.Approved)
        {
            post.Status = PostStatus.Published;
            post.UpdatedAt = DateTimeOffset.UtcNow;
        }
    }

    private string ResolveMediaPath(string mediaUrl)
    {
        const string prefix = "/uploads/posts/";
        if (!mediaUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new KeyNotFoundException("Đường dẫn media không hợp lệ.");
        }

        var webRoot = _environment.WebRootPath
            ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var root = Path.GetFullPath(
            Path.Combine(webRoot, "uploads", "posts"));
        var candidate = Path.GetFullPath(
            Path.Combine(root, Path.GetFileName(mediaUrl)));
        if (!candidate.StartsWith(
                $"{root}{Path.DirectorySeparatorChar}",
                StringComparison.OrdinalIgnoreCase)
            || !File.Exists(candidate))
        {
            throw new KeyNotFoundException("File media không còn khả dụng.");
        }

        return candidate;
    }

    private ExternalCopyrightScanDto ToDto(ExternalCopyrightScan scan)
    {
        return new ExternalCopyrightScanDto
        {
            Id = scan.Id,
            PostId = scan.PostMedia.PostId,
            PostMediaId = scan.PostMediaId,
            UploaderId = scan.PostMedia.Post.AuthorId,
            MediaType = scan.PostMedia.MediaType,
            MediaUrl = _mediaUrlService.CreatePostMediaUrl(scan.PostMediaId),
            Provider = scan.Provider,
            Status = scan.Status,
            MatchSummary = scan.MatchSummary,
            ErrorMessage = scan.ErrorMessage,
            ReviewNotes = scan.ReviewNotes,
            AppealReason = scan.AppealReason,
            EvidenceLinks = ReadEvidenceLinks(scan),
            CreatedAt = scan.CreatedAt,
            UpdatedAt = scan.UpdatedAt,
            ReviewedAt = scan.ReviewedAt,
            AppealedAt = scan.AppealedAt,
            AppealDeadline = scan.ReviewedAt?.AddDays(
                _settings.AppealWindowDays),
            CanAppeal = scan.Status ==
                    ExternalCopyrightScanStatus.ViolationConfirmed
                && scan.ReviewedAt.HasValue
                && scan.ReviewedAt.Value.AddDays(
                    _settings.AppealWindowDays) >= DateTimeOffset.UtcNow
        };
    }

    private static List<string> ReadEvidenceLinks(
        ExternalCopyrightScan scan)
    {
        if (scan.Provider != GoogleVisionProvider
            || string.IsNullOrWhiteSpace(scan.ProviderResultJson))
        {
            return [];
        }

        try
        {
            using var document = JsonDocument.Parse(scan.ProviderResultJson);
            var response = document.RootElement
                .GetProperty("responses")
                .EnumerateArray()
                .FirstOrDefault();
            if (response.ValueKind == JsonValueKind.Undefined
                || !response.TryGetProperty(
                    "webDetection",
                    out var detection))
            {
                return [];
            }

            var links = new List<string>();
            AddEvidenceLinks(
                detection,
                "pagesWithMatchingImages",
                links);
            AddEvidenceLinks(
                detection,
                "fullMatchingImages",
                links);
            AddEvidenceLinks(
                detection,
                "partialMatchingImages",
                links);
            return links
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(5)
                .ToList();
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static void AddEvidenceLinks(
        JsonElement detection,
        string property,
        List<string> links)
    {
        if (!detection.TryGetProperty(property, out var items)
            || items.ValueKind != JsonValueKind.Array)
        {
            return;
        }

        foreach (var item in items.EnumerateArray())
        {
            var value = ReadString(item, "url");
            if (Uri.TryCreate(value, UriKind.Absolute, out var uri)
                && uri.Scheme is "http" or "https")
            {
                links.Add(uri.AbsoluteUri);
            }
        }
    }

    private static int ArrayLength(JsonElement parent, string property)
    {
        return parent.TryGetProperty(property, out var value)
            && value.ValueKind == JsonValueKind.Array
            ? value.GetArrayLength()
            : 0;
    }

    private static string? ReadString(JsonElement element, string property)
    {
        return element.TryGetProperty(property, out var value)
            && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
    }

    private static string? ReadStringOrNumber(
        JsonElement element,
        string property)
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

    private static string ReadArtistNames(JsonElement item)
    {
        if (!item.TryGetProperty("artists", out var artists)
            || artists.ValueKind != JsonValueKind.Array)
        {
            return string.Empty;
        }

        return string.Join(
            ", ",
            artists
                .EnumerateArray()
                .Select(artist => ReadString(artist, "name"))
                .Where(name => !string.IsNullOrWhiteSpace(name)));
    }

    private static string SafeError(string message)
    {
        return message.Length <= 2000
            ? message
            : message[..2000];
    }
}
