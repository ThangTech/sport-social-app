using SocialSport.Domain.Common;
using SocialSport.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Domain.Entities
{
    public class Report : BaseEntity
    {
        public Guid ReporterId { get; set; }

        public ReportTargetType TargetType { get; set; }

        public Guid TargetId { get; set; }

        public string Reason { get; set; } = string.Empty;

        public string? Description { get; set; }

        public ReportStatus Status { get; set; } = ReportStatus.Pending;

        public Guid? ReviewedBy { get; set; }

        public DateTimeOffset? ReviewedAt { get; set; }
    }
}
