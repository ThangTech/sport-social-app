using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Admin;

public class UpdateAdminStatusRequest
{
    [Range(1, 10)] public int Status { get; set; }
}
