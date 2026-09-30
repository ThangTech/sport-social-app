export enum NotificationType {
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
  CopyrightScanResolved = 12,
  GroupPostReviewPending = 13,
  GroupPostApproved = 14,
  GroupPostRejected = 15,
}

export type NotificationDto = {
  id: string;
  type: NotificationType;
  actorId?: string | null;
  actorName?: string | null;
  actorAvatarUrl?: string | null;
  message: string;
  targetTitle?: string | null;
  targetPreview?: string | null;
  postId?: string | null;
  groupId?: string | null;
  copyrightReviewId?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsResponse = {
  items: NotificationDto[];
  nextCursor?: string | null;
};
