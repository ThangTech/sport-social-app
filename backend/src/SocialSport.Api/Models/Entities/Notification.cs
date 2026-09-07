using SocialSport.Api.Models.Common;
using SocialSport.Api.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Api.Models.Entities
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
