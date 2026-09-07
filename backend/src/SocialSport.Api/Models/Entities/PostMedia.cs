using SocialSport.Api.Models.Common;
using SocialSport.Api.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Api.Models.Entities
{
    public class PostMedia : BaseEntity
    {
        public Guid PostId { get; set; }

        public string Url { get; set; } = string.Empty;

        public MediaType MediaType { get; set; }

        public int SortOrder { get; set; }

        public int? Width { get; set; }

        public int? Height { get; set; }

        public Post Post { get; set; } = null!;
    }
}
