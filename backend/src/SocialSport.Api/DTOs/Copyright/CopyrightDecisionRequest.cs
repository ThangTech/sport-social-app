using SocialSport.Api.Models.Enums;
using System.ComponentModel.DataAnnotations;
namespace SocialSport.Api.DTOs.Copyright;
public class CopyrightDecisionRequest
{
    public CopyrightCaseStatus Status { get; set; }
    [Required, StringLength(3000, MinimumLength = 3)] public string Notes { get; set; } = string.Empty;
}
