using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.DTOs.Post
{
    public class PostDto
    {
        public Guid Id { get; set; }

        public Guid AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorAvatar { get; set; }

        public Guid? GroupId { get; set; }
        public string? GroupName { get; set; }

        public Guid? SportId { get; set; }
        public string? SportName { get; set; }

        public string? Content { get; set; }

        public PostVisibility Visibility { get; set; }

        public int LikeCount { get; set; }
        public int CommentCount { get; set; }

        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset? UpdatedAt { get; set; }

        public List<PostMediaDto> Media { get; set; } = [];
    }
}
