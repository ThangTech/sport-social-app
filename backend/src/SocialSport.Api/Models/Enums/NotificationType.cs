using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SocialSport.Api.Models.Enums
{
    public enum NotificationType
    {
        Follow = 1,
        PostReaction = 2,
        Comment = 3,
        CommentReply = 4,
        GroupInvite = 5,
        GroupJoinApproved = 6,
        GroupJoinRejected = 7,
        CopyrightReviewPending = 8,
        CopyrightConfirmed = 9,
        CopyrightDismissed = 10,
        CopyrightAppealResolved = 11,
        CopyrightScanResolved = 12
    }
}
