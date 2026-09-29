using SocialSport.Api.Models.Common;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Models.Entities;

public class Incident : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? Impact { get; set; }
    public string? ResponseNotes { get; set; }
    public string? RootCause { get; set; }
    public IncidentSeverity Severity { get; set; } = IncidentSeverity.Medium;
    public IncidentStatus Status { get; set; } = IncidentStatus.Open;
    public Guid CreatedBy { get; set; }
    public Guid? OwnerId { get; set; }
    public DateTimeOffset DetectedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ResolvedAt { get; set; }
}
