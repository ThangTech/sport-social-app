using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.DTOs.Group
{
    public class GroupMemberDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public GroupMemberRole Role { get; set; }
        public GroupMemberStatus Status { get; set; }
        public DateTimeOffset JoinedAt { get; set; }
    }
}
