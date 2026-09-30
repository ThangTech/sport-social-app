using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Admin;

public class CreateAdminSportRequest
{
    [Required]
    [StringLength(80, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    [StringLength(80, MinimumLength = 2)]
    public string Slug { get; set; } = string.Empty;

    [StringLength(500)]
    public string? IconUrl { get; set; }
}

public class UpdateAdminSportRequest : CreateAdminSportRequest
{
    public bool IsActive { get; set; }
}
