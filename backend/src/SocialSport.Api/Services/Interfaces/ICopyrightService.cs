using SocialSport.Api.DTOs.Common;
using SocialSport.Api.DTOs.Copyright;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Services.Interfaces;

public interface ICopyrightService
{
    Task<string> ComputeHashAsync(string path);
    Task<bool> EvaluateUploadAsync(Guid uploaderId, Post post, PostMedia media);
    Task<CopyrightAsset> CreateAssetAsync(Guid adminId, string title, string rightsOwnerName, string? evidenceNotes, IFormFile file);
    Task<(string Path, string ContentType)> GetAssetMediaAsync(Guid assetId);
    Task<(string Path, string ContentType)> GetCaseMediaAsync(Guid caseId);
    Task<PagedResponse<CopyrightCaseDto>> GetCasesAsync(int page, int pageSize, CopyrightCaseStatus? status);
    Task<List<CopyrightCaseDto>> GetMineAsync(Guid userId);
    Task DecideAsync(Guid adminId, Guid caseId, CopyrightDecisionRequest request);
    Task AppealAsync(Guid userId, Guid caseId, CopyrightAppealRequest request);
}
