using SocialSport.Api.Models.Common;
using SocialSport.Api.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Api.Models.Entities
{
    public class Group : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public string Slug { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? AvatarUrl { get; set; }

        public string? CoverUrl { get; set; }

        public Guid OwnerId { get; set; }

        public GroupPrivacy Privacy { get; set; } = GroupPrivacy.Public;

        public GroupStatus Status { get; set; } = GroupStatus.Active;

        public ICollection<GroupMember> Members { get; set; } = [];

        public ICollection<Post> Posts { get; set; } = [];
    }
}
