import { api } from "@/services/api";
import type { FeedPostDto } from "@/types/feed";
import type { UserProfileDto } from "@/types/user";

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
