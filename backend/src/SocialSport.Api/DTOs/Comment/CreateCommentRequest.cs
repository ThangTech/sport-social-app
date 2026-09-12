using System.ComponentModel.DataAnnotations;

namespace SocialSport.Api.DTOs.Comment
{
    public class CreateCommentRequest
    {
        [Required]
        [StringLength(3000, MinimumLength = 1)]
        public string Content { get; set; } = string.Empty;

        public Guid? ParentCommentId { get; set; }
    }
}
