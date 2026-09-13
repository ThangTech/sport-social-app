using SocialSport.Api.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Group
{
    public class CreateGroupRequest
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        public GroupPrivacy Privacy { get; set; } = GroupPrivacy.Public;
    }
}
