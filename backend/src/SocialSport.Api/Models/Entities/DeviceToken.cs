using SocialSport.Api.Models.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Api.Models.Entities
{
    public class DeviceToken : BaseEntity
    {
        public Guid UserId { get; set; }

        public string ExpoPushToken { get; set; } = string.Empty;

        public string Platform { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTimeOffset LastUsedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
