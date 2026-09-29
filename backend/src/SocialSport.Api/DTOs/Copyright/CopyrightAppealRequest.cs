using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Copyright;

public class CopyrightAppealRequest
{
    [Required]
    [StringLength(3000, MinimumLength = 10)]
    public string Reason { get; set; } = string.Empty;
}
