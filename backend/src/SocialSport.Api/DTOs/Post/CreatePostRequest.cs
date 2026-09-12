using SocialSport.Api.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Post
{
    public class CreatePostRequest
    {
        [Required]
        [StringLength(5000, MinimumLength = 1)]
        public string Content { get; set; } = string.Empty;

        public Guid? SportId { get; set; }

        public PostVisibility Visibility { get; set; } = PostVisibility.Public;
    }
}
