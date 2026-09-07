using SocialSport.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Domain.Entities
{
    public class RefreshToken : BaseEntity
    {
        public Guid UserId { get; set; }

        public string TokenHash { get; set; } = string.Empty;

        public DateTimeOffset ExpiresAt { get; set; }

        public DateTimeOffset? RevokedAt { get; set; }

        public Guid? ReplacedByTokenId { get; set; }

        public bool IsRevoked => RevokedAt.HasValue;

        public bool IsExpired => DateTimeOffset.UtcNow >= ExpiresAt;

        public bool IsActive =>
            !IsRevoked &&
            !IsExpired;
    }
}
