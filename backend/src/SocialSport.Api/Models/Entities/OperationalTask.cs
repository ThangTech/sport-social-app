using SocialSport.Api.Models.Common;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Models.Entities;

public class OperationalTask : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Procedure { get; set; }
    public OperationalTaskStatus Status { get; set; } = OperationalTaskStatus.Open;
    public OperationalPriority Priority { get; set; } = OperationalPriority.Medium;
    public Guid CreatedBy { get; set; }
    public Guid? AssignedTo { get; set; }
    public DateTimeOffset? DueAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}
