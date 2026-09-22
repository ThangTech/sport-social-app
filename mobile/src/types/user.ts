export type UserProfileDto = {
  id: string;
  userName: string;
  displayName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  dateOfBirth?: string | null;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
};
