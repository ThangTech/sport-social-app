using SocialSport.Api.Models.Common;
using SocialSport.Api.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Api.Models.Entities
{
    public class Comment : BaseEntity
    {
        public Guid PostId { get; set; }

        public Guid AuthorId { get; set; }

        public Guid? ParentCommentId { get; set; }

        public string Content { get; set; } = string.Empty;

        public CommentStatus Status { get; set; } = CommentStatus.Published;

        public Post Post { get; set; } = null!;

        public Comment? ParentComment { get; set; }

        public ICollection<Comment> Replies { get; set; } = [];
    }
}
