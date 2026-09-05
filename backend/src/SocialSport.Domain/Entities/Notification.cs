using SocialSport.Domain.Common;
using SocialSport.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Domain.Entities
{
    public class Notification : BaseEntity
    {
        public Guid UserId { get; set; }

        public Guid? ActorId { get; set; }

        public NotificationType Type { get; set; }

        public Guid? EntityId { get; set; }

        public bool IsRead { get; set; }

        public DateTimeOffset? ReadAt { get; set; }
    }
}
