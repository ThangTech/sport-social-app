using SocialSport.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Domain.Entities
{
    public class PostReaction
    {
        public Guid PostId { get; set; }

        public Guid UserId { get; set; }

        public ReactionType Type { get; set; } = ReactionType.Like;

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public Post Post { get; set; } = null!;
    }
}
