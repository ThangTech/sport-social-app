using SocialSport.Api.Models.Common;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Models.Entities;

public class ExternalCopyrightScan : BaseEntity
{
    public Guid PostMediaId { get; set; }

    public string Provider { get; set; } = string.Empty;

    public ExternalCopyrightScanStatus Status { get; set; } =
        ExternalCopyrightScanStatus.Processing;

    public string? ExternalJobId { get; set; }

    public string? MatchSummary { get; set; }

    public string? ProviderResultJson { get; set; }

    public string? ErrorMessage { get; set; }

    public Guid? ReviewedBy { get; set; }

    public DateTimeOffset? ReviewedAt { get; set; }

    public string? ReviewNotes { get; set; }

    public string? AppealReason { get; set; }

    public DateTimeOffset? AppealedAt { get; set; }

    public PostMedia PostMedia { get; set; } = null!;
}
