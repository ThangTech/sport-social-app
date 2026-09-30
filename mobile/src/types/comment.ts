export type CommentDto = {
  id: string;
  postId: string;

  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorGroupRole?: string | null;

  parentCommentId?: string | null;
  replyToUserId?: string | null;
  replyToUserName?: string | null;

  content: string;
  isDeleted: boolean;

  createdAt: string;
  updatedAt?: string | null;

  replies: CommentDto[];
};

export type CreateCommentRequest = {
  content: string;
  parentCommentId?: string | null;
};
