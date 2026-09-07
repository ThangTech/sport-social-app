using SocialSport.Domain.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Domain.Entities
{
    public class Sport : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        public string Slug { get; set; } = string.Empty;

        public string? IconUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public ICollection<Post> Posts { get; set; } = [];
    }
}
