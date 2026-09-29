using SocialSport.Api.Models.Common;

namespace SocialSport.Api.Models.Entities;

public class ContingencyPlan : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string TriggerConditions { get; set; } = string.Empty;
    public string ResponseSteps { get; set; } = string.Empty;
    public string RecoverySteps { get; set; } = string.Empty;
    public string Owner { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public Guid CreatedBy { get; set; }
}
