using SocialSport.Api.Models.Enums;
namespace SocialSport.Api.DTOs.Copyright;
public class CopyrightCaseDto
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid PostMediaId { get; set; }
    public string MediaUrl { get; set; } = string.Empty;
    public Guid CopyrightAssetId { get; set; }
    public string AssetTitle { get; set; } = string.Empty;
    public string RightsOwnerName { get; set; } = string.Empty;
    public Guid UploaderId { get; set; }
    public decimal Confidence { get; set; }
    public CopyrightCaseStatus Status { get; set; }
    public string? DecisionNotes { get; set; }
    public string? AppealReason { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
