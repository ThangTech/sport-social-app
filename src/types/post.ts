import { ImageSourcePropType } from "react-native";

export type Post = {
  id: string;
  authorName: string;
  authorAvatar: ImageSourcePropType;
  createdAt: string;
  content: string;
  image: ImageSourcePropType;
  sport: string;
  likeCount: number;
  commentCount: number;
};