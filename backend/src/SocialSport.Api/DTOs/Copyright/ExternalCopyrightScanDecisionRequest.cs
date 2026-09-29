using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Copyright;

public class ExternalCopyrightScanDecisionRequest
{
    public bool IsViolation { get; set; }

    [Required]
    [StringLength(3000, MinimumLength = 3)]
    public string Notes { get; set; } = string.Empty;
}
