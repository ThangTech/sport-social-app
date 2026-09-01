import { ImageSourcePropType } from "react-native";

export type User = {
  id: string;
  name: string;
  username: string;
  avatar: ImageSourcePropType;
  bio: string;
  followerCount: number;
  followingCount: number;
};