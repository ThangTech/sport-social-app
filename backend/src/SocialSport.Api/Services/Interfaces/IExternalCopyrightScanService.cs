using SocialSport.Api.DTOs.Common;
using SocialSport.Api.DTOs.Copyright;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Services.Interfaces;

public interface IExternalCopyrightScanService
{
    Task<ExternalCopyrightScan?> SubmitAsync(
        Post post,
        PostMedia media,
        string filePath,
        string contentType,
        bool replaceExisting = false,
        CancellationToken cancellationToken = default);

    Task<PagedResponse<ExternalCopyrightScanDto>> GetScansAsync(
        int page,
        int pageSize,
        ExternalCopyrightScanStatus? status);

    Task<List<ExternalCopyrightScanDto>> GetMineAsync(Guid userId);

    Task<(string Path, string ContentType)> GetMediaAsync(Guid scanId);

    Task<ExternalCopyrightScanDto> RefreshAsync(
        Guid scanId,
        CancellationToken cancellationToken = default);

    Task DecideAsync(
        Guid adminId,
        Guid scanId,
        ExternalCopyrightScanDecisionRequest request);

    Task AppealAsync(
        Guid userId,
        Guid scanId,
        CopyrightAppealRequest request);
}
