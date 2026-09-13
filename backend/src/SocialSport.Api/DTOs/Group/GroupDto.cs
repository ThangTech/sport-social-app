using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.DTOs.Group
{
    public class GroupDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? AvatarUrl { get; set; }
        public string? CoverUrl { get; set; }

        public Guid OwnerId { get; set; }
        public string OwnerName { get; set; } = string.Empty;

        public GroupPrivacy Privacy { get; set; }
        public GroupStatus Status { get; set; }

        public int MemberCount { get; set; }

        public bool IsMember { get; set; }
        public GroupMemberRole? CurrentUserRole { get; set; }

        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset? UpdatedAt { get; set; }
    }
}
