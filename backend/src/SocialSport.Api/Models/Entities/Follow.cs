using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Domain.Entities
{
    public class Follow
    {
        public Guid FollowerId { get; set; }

        public Guid FollowingId { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
