using SocialSport.Api.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Admin;

public class UpdateReportStatusRequest
{
    public ReportStatus Status { get; set; }

    [StringLength(1000)]
    public string? ResolutionNote { get; set; }
}
