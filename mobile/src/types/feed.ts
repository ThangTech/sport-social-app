export type PostMediaDto = {
  id: string;
  url: string;
  mediaType: number;
  sortOrder: number;
};

export type FeedPostDto = {
  id: string;

  authorId: string;
  authorName: string;
  authorAvatar?: string | null;

  groupId?: string | null;
  groupName?: string | null;

  sportId?: string | null;
  sportName?: string | null;

  content?: string | null;

  visibility: number;

  likeCount: number;
  commentCount: number;
  currentReaction?: number | null;
  createdAt: string;
  updatedAt?: string | null;

  media: PostMediaDto[];
};

export type FeedResponse = {
  items: FeedPostDto[];
  nextCursor?: string | null;
};
