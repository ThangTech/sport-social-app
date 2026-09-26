import { ImageSourcePropType } from "react-native";

export type Post = {
  id: string;

  authorId: string;
  authorName: string;
  authorAvatar: ImageSourcePropType;

  groupId?: string;
  groupName?: string;

  createdAt: string;
  content: string;
  visibility: number;
  image?: ImageSourcePropType;
  sport?: string;

  likeCount: number;
  commentCount: number;
  currentReaction?: number | null;
  isSaved: boolean;
};
export type ReactionResponse = {
  reactionCount: number;
  currentReaction?: number | null;
};

export type PostReactionDto = {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  reactedAt: string;
};

export type PostReactionsResponse = {
  items: PostReactionDto[];
  nextCursor?: string | null;
};
export type CreatePostRequest = {
  content: string;
  sportId?: string | null;
  visibility: number;
};
export type UpdatePostRequest = {
  content: string;
  sportId?: string | null;
  visibility: number;
};
export type PostMediaUploadResponse = {
  id: string;
  url: string;
  mediaType: number;
  sortOrder: number;
};
