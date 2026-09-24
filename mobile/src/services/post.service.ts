import { api } from "@/services/api";
import type { FeedPostDto } from "@/types/feed";
import type { ReactionResponse, CreatePostRequest } from "@/types/post";

export const getPostById = async (id: string) => {
  return await api<FeedPostDto>(`/posts/${id}`, {
    method: "GET",
    auth: true,
  });
};
export const reactPost = async (id: string, type = 1) => {
  return await api<ReactionResponse>(`/posts/${id}/reactions`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({
      type,
    }),
  });
};

export const removePostReaction = async (id: string) => {
  return await api<ReactionResponse>(`/posts/${id}/reactions`, {
    method: "DELETE",
    auth: true,
  });
};
export const savePost = async (id: string) => {
  return await api<void>(`/posts/${id}/save`, {
    method: "POST",
    auth: true,
  });
};

export const unsavePost = async (id: string) => {
  return await api<void>(`/posts/${id}/save`, {
    method: "DELETE",
    auth: true,
  });
};
export const getSavedPosts = async () => {
  return await api<FeedPostDto[]>("/posts/saved", {
    method: "GET",
    auth: true,
  });
};
export const createPost = async (request: CreatePostRequest) => {
  return await api<FeedPostDto>("/posts", {
    method: "POST",
    auth: true,
    body: JSON.stringify(request),
  });
};
