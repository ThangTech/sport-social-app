namespace SocialSport.Api.DTOs.Comment
{
    public class CommentDto
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public Guid AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorAvatar { get; set; }
        public string? AuthorGroupRole { get; set; }
        public Guid? ParentCommentId { get; set; }
        public Guid? ReplyToUserId { get; set; }
        public string? ReplyToUserName { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool IsDeleted { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset? UpdatedAt { get; set; }
        public List<CommentDto> Replies { get; set; } = [];
    }
}
