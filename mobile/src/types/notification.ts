export enum NotificationType {
  Follow = 1,
  PostReaction = 2,
  Comment = 3,
  CommentReply = 4,
  GroupInvite = 5,
  GroupJoinApproved = 6,
  GroupJoinRejected = 7,
}

export type NotificationDto = {
  id: string;
  type: NotificationType;
  actorId?: string | null;
  actorName?: string | null;
  actorAvatarUrl?: string | null;
  message: string;
  postId?: string | null;
  groupId?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsResponse = {
  items: NotificationDto[];
  nextCursor?: string | null;
};
