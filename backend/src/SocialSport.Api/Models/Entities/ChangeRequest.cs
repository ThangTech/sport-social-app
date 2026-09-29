using SocialSport.Api.Models.Common;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Models.Entities;

public class ChangeRequest : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImplementationPlan { get; set; } = string.Empty;
    public string RollbackPlan { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = "medium";
    public ChangeRequestStatus Status { get; set; } = ChangeRequestStatus.Draft;
    public Guid RequestedBy { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTimeOffset? ScheduledAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}
