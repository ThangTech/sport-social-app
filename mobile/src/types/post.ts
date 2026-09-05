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
  image: ImageSourcePropType;
  sport: string;
  likeCount: number;
  commentCount: number;
};
