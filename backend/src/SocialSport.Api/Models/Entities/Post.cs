using SocialSport.Api.Models.Common;
using SocialSport.Api.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace SocialSport.Api.Models.Entities
{
    public class Post : BaseEntity
    {
        public Guid AuthorId { get; set; }

        public Guid? GroupId { get; set; }

        public Guid? SportId { get; set; }

        public string? Content { get; set; }

        public PostVisibility Visibility { get; set; } = PostVisibility.Public;

        public PostStatus Status { get; set; } = PostStatus.Published;

        public Group? Group { get; set; }

        public Sport? Sport { get; set; }

        public ICollection<PostMedia> Media { get; set; } = [];

        public ICollection<Comment> Comments { get; set; } = [];

        public ICollection<PostReaction> Reactions { get; set; } = [];

        public ICollection<SavedPost> SavedByUsers { get; set; } = [];
    }
}
