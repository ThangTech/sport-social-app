using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Domain.Entities
{
    public class UserBlock
    {
        public Guid BlockerId { get; set; }

        public Guid BlockedId { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
