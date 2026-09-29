using SocialSport.Api.DTOs.Report;

namespace SocialSport.Api.Services.Interfaces;

public interface IReportService
{
    Task<ReportDto> CreateAsync(Guid reporterId, CreateReportRequest request);
    Task<List<ReportDto>> GetMineAsync(Guid reporterId);
}
