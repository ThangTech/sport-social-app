using SocialSport.Api.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Report;

public class CreateReportRequest
{
    public ReportTargetType TargetType { get; set; }
    public Guid TargetId { get; set; }
    [Required, StringLength(50)] public string Reason { get; set; } = string.Empty;
    [StringLength(3000)] public string? Description { get; set; }
}
