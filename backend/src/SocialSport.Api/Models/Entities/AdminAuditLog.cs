using SocialSport.Api.Models.Common;

namespace SocialSport.Api.Models.Entities;

public class AdminAuditLog : BaseEntity
{
    public Guid ActorId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public string? TargetId { get; set; }
    public string Summary { get; set; } = string.Empty;
}
