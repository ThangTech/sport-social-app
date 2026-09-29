using Microsoft.EntityFrameworkCore;
using SocialSport.Api.Data;
using SocialSport.Api.DTOs.Common;
using SocialSport.Api.DTOs.Copyright;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Services.Interfaces;
using System.Security.Cryptography;

namespace SocialSport.Api.Services.Implementations;
public class CopyrightService : ICopyrightService
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    public CopyrightService(ApplicationDbContext context, IWebHostEnvironment environment) { _context = context; _environment = environment; }

    public async Task<string> ComputeHashAsync(string path)
    {
        await using var stream = File.OpenRead(path);
        return Convert.ToHexString(await SHA256.HashDataAsync(stream)).ToLowerInvariant();
    }

    public async Task<bool> EvaluateUploadAsync(Guid uploaderId, Post post, PostMedia media)
    {
        if (string.IsNullOrWhiteSpace(media.ContentHash)) return false;
        var assets = await _context.CopyrightAssets.Where(x => x.Status == CopyrightAssetStatus.Active && x.MediaType == media.MediaType && x.ContentHash == media.ContentHash && !_context.CopyrightCases.Any(c => c.CopyrightAssetId == x.Id && c.PostMediaId == media.Id)).ToListAsync();
        foreach (var asset in assets)
            await _context.CopyrightCases.AddAsync(new CopyrightCase { Id = Guid.NewGuid(), CopyrightAssetId = asset.Id, PostMediaId = media.Id, UploaderId = uploaderId, Confidence = 1m, Status = CopyrightCaseStatus.Pending, CreatedAt = DateTimeOffset.UtcNow });
        if (assets.Count == 0) return false;
        post.Status = PostStatus.Hidden; post.UpdatedAt = DateTimeOffset.UtcNow;
        return true;
    }

    public async Task<CopyrightAsset> CreateAssetAsync(Guid adminId, string title, string rightsOwnerName, string? evidenceNotes, IFormFile file)
    {
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(rightsOwnerName) || file.Length == 0 || file.Length > 200 * 1024 * 1024) throw new InvalidOperationException("Thông tin hoặc file reference không hợp lệ.");
        var mediaType = file.ContentType.StartsWith("image/") ? MediaType.Image : file.ContentType.StartsWith("video/") ? MediaType.Video : throw new InvalidOperationException("Reference chỉ hỗ trợ ảnh hoặc video.");
        var folder = Path.Combine(_environment.ContentRootPath, "App_Data", "copyright-references"); Directory.CreateDirectory(folder);
        var path = Path.Combine(folder, $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName).ToLowerInvariant()}");
        await using (var stream = new FileStream(path, FileMode.CreateNew)) await file.CopyToAsync(stream);
        var asset = new CopyrightAsset { Id = Guid.NewGuid(), CreatedByUserId = adminId, Title = title.Trim(), RightsOwnerName = rightsOwnerName.Trim(), EvidenceNotes = evidenceNotes?.Trim(), ContentHash = await ComputeHashAsync(path), MediaType = mediaType, ReferencePath = path, Status = CopyrightAssetStatus.Active, CreatedAt = DateTimeOffset.UtcNow };
        await _context.CopyrightAssets.AddAsync(asset); await _context.SaveChangesAsync(); return asset;
    }

    public async Task<PagedResponse<CopyrightCaseDto>> GetCasesAsync(int page, int pageSize, CopyrightCaseStatus? status)
    {
        page = Math.Max(page, 1); pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _context.CopyrightCases.AsNoTracking().Include(x => x.CopyrightAsset).Include(x => x.PostMedia).AsQueryable();
        if (status.HasValue) query = query.Where(x => x.Status == status);
        var total = await query.CountAsync(); var cases = await query.OrderByDescending(x => x.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResponse<CopyrightCaseDto> { Items = cases.Select(ToDto).ToList(), Page = page, PageSize = pageSize, Total = total };
    }

    public async Task<List<CopyrightCaseDto>> GetMineAsync(Guid userId) => (await _context.CopyrightCases.AsNoTracking().Include(x => x.CopyrightAsset).Include(x => x.PostMedia).Where(x => x.UploaderId == userId).OrderByDescending(x => x.CreatedAt).Take(100).ToListAsync()).Select(ToDto).ToList();

    public async Task DecideAsync(Guid adminId, Guid caseId, CopyrightDecisionRequest request)
    {
        if (request.Status is not (CopyrightCaseStatus.Confirmed or CopyrightCaseStatus.Dismissed or CopyrightCaseStatus.AppealAccepted or CopyrightCaseStatus.AppealRejected)) throw new InvalidOperationException("Quyết định bản quyền không hợp lệ.");
        var item = await _context.CopyrightCases.Include(x => x.PostMedia).ThenInclude(x => x.Post).FirstOrDefaultAsync(x => x.Id == caseId) ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ bản quyền.");
        item.Status = request.Status; item.DecisionNotes = request.Notes.Trim(); item.ReviewedBy = adminId; item.ReviewedAt = DateTimeOffset.UtcNow;
        if (request.Status is CopyrightCaseStatus.Dismissed or CopyrightCaseStatus.AppealAccepted)
        {
            var hasOtherBlockingCase = await _context.CopyrightCases.AnyAsync(x => x.Id != item.Id && x.PostMedia.PostId == item.PostMedia.PostId && x.Status != CopyrightCaseStatus.Dismissed && x.Status != CopyrightCaseStatus.AppealAccepted);
            if (!hasOtherBlockingCase) item.PostMedia.Post.Status = PostStatus.Published;
        }
        else if (request.Status is CopyrightCaseStatus.Confirmed or CopyrightCaseStatus.AppealRejected) item.PostMedia.Post.Status = PostStatus.Removed;
        item.PostMedia.Post.UpdatedAt = DateTimeOffset.UtcNow; await _context.SaveChangesAsync();
    }

    public async Task AppealAsync(Guid userId, Guid caseId, CopyrightAppealRequest request)
    {
        var item = await _context.CopyrightCases.FirstOrDefaultAsync(x => x.Id == caseId && x.UploaderId == userId) ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ bản quyền.");
        if (item.Status != CopyrightCaseStatus.Confirmed) throw new InvalidOperationException("Chỉ quyết định vi phạm đã xác nhận mới có thể kháng nghị.");
        item.Status = CopyrightCaseStatus.Appealed; item.AppealReason = request.Reason.Trim(); item.AppealedAt = DateTimeOffset.UtcNow; await _context.SaveChangesAsync();
    }

    private static CopyrightCaseDto ToDto(CopyrightCase x) => new() { Id = x.Id, PostId = x.PostMedia.PostId, PostMediaId = x.PostMediaId, MediaUrl = x.PostMedia.Url, CopyrightAssetId = x.CopyrightAssetId, AssetTitle = x.CopyrightAsset.Title, RightsOwnerName = x.CopyrightAsset.RightsOwnerName, UploaderId = x.UploaderId, Confidence = x.Confidence, Status = x.Status, DecisionNotes = x.DecisionNotes, AppealReason = x.AppealReason, CreatedAt = x.CreatedAt };
}
