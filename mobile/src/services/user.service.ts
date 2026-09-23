import { api } from "@/services/api";
import type { FeedPostDto } from "@/types/feed";
import type { UserProfileDto, UserSummaryDto } from "@/types/user";

export const getUserProfile = async (id: string) => {
  return await api<UserProfileDto>(`/users/${id}`, {
    method: "GET",
    auth: true,
  });
};

export const getUserPosts = async (id: string) => {
  return await api<FeedPostDto[]>(`/users/${id}/posts`, {
    method: "GET",
    auth: true,
  });
};
export const followUser = async (id: string) => {
  return await api<void>(`/users/${id}/follow`, {
    method: "POST",
    auth: true,
  });
};

export const unfollowUser = async (id: string) => {
  return await api<void>(`/users/${id}/follow`, {
    method: "DELETE",
    auth: true,
  });
};
export const getFollowers = async (id: string) => {
  return await api<UserSummaryDto[]>(`/users/${id}/followers`, {
    method: "GET",
    auth: true,
  });
};

export const getFollowing = async (id: string) => {
  return await api<UserSummaryDto[]>(`/users/${id}/following`, {
    method: "GET",
    auth: true,
  });
};
