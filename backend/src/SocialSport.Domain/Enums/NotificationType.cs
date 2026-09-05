using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Domain.Enums
{
    public enum NotificationType
    {
        Follow = 1,
        PostReaction = 2,
        Comment = 3,
        CommentReply = 4,
        GroupInvite = 5,
        GroupJoinApproved = 6
    }
}
