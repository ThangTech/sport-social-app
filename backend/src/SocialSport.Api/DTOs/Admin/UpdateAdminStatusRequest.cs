using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Admin;

public class UpdateAdminStatusRequest
{
    public byte[]? RowVersion { get; set; }
    [StringLength(1000)]
    public string? Reason { get; set; }
    [Range(1, 10)]
    public int Status { get; set; }
}
