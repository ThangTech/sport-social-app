using SocialSport.Api.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Api.Models.Entities
{
    public class GroupMember
    {
        public Guid GroupId { get; set; }

        public Guid UserId { get; set; }

        public GroupMemberRole Role { get; set; } = GroupMemberRole.Member;

        public GroupMemberStatus Status { get; set; } = GroupMemberStatus.Active;

        public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;

        public Group Group { get; set; } = null!;
    }
}
