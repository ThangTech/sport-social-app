import type { FeedPostDto } from "@/types/feed";

export enum GroupPrivacy {
  Public = 1,
  Private = 2,
}

export enum GroupStatus {
  Active = 1,
  Suspended = 2,
  Removed = 3,
}

export enum GroupMemberRole {
  Member = 1,
  Moderator = 2,
  Admin = 3,
}

export enum GroupMemberStatus {
  Pending = 1,
  Active = 2,
  Banned = 3,
}

export type GroupDto = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  ownerId: string;
  ownerName: string;
  privacy: GroupPrivacy;
  status: GroupStatus;
  memberCount: number;
  isMember: boolean;
  currentUserRole?: GroupMemberRole | null;
  currentUserMemberStatus?: GroupMemberStatus | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type GroupMemberDto = {
  userId: string;
  userName: string;
  displayName: string;
  avatarUrl?: string | null;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinedAt: string;
};

export type SaveGroupRequest = {
  name: string;
  description: string | null;
  privacy: GroupPrivacy;
};

export type CreateGroupPostRequest = {
  content: string;
  sportId?: string | null;
};

export type UpdateGroupMemberRoleRequest = {
  role: GroupMemberRole;
};

export type GroupsResponse = {
  items: GroupDto[];
  nextCursor?: string | null;
};

export type GroupPostsResponse = {
  items: FeedPostDto[];
  nextCursor?: string | null;
};
