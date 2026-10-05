using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.DTOs.Copyright;

public class ExternalCopyrightScanDto
{
    public Guid Id { get; set; }

    public Guid PostId { get; set; }

    public Guid PostMediaId { get; set; }

    public Guid UploaderId { get; set; }

    public MediaType MediaType { get; set; }

    public string MediaUrl { get; set; } = string.Empty;

    public string Provider { get; set; } = string.Empty;

    public ExternalCopyrightScanStatus Status { get; set; }

    public string? MatchSummary { get; set; }

    public string? ErrorMessage { get; set; }

    public string? ReviewNotes { get; set; }

    public string? AppealReason { get; set; }

    public List<string> EvidenceLinks { get; set; } = [];

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public DateTimeOffset? ReviewedAt { get; set; }

    public DateTimeOffset? AppealedAt { get; set; }

    public DateTimeOffset? AppealDeadline { get; set; }

    public bool CanAppeal { get; set; }
}
