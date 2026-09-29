using SocialSport.Api.Models.Common;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Models.Entities;

public class CopyrightCase : BaseEntity
{
    public Guid CopyrightAssetId { get; set; }
    public Guid PostMediaId { get; set; }
    public Guid UploaderId { get; set; }
    public decimal Confidence { get; set; }
    public CopyrightCaseStatus Status { get; set; } = CopyrightCaseStatus.Pending;
    public Guid? ReviewedBy { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public string? DecisionNotes { get; set; }
    public string? AppealReason { get; set; }
    public DateTimeOffset? AppealedAt { get; set; }
    public CopyrightAsset CopyrightAsset { get; set; } = null!;
    public PostMedia PostMedia { get; set; } = null!;
}
