using SocialSport.Api.Models.Common;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Models.Entities;

public class CopyrightAsset : BaseEntity
{
    public Guid CreatedByUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string RightsOwnerName { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty;
    public MediaType MediaType { get; set; }
    public string ReferencePath { get; set; } = string.Empty;
    public string? EvidenceNotes { get; set; }
    public CopyrightAssetStatus Status { get; set; } = CopyrightAssetStatus.Active;
}
