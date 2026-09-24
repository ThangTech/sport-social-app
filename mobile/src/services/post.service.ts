import { api } from "@/services/api";
import type { FeedPostDto } from "@/types/feed";
import type {
  ReactionResponse,
  CreatePostRequest,
  UpdatePostRequest,
  PostMediaUploadResponse,
} from "@/types/post";
import type { ImagePickerAsset } from "expo-image-picker";
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
export const updatePost = async (id: string, request: UpdatePostRequest) => {
  return await api<FeedPostDto>(`/posts/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(request),
  });
};

export const deletePost = async (id: string) => {
  return await api<void>(`/posts/${id}`, {
    method: "DELETE",
    auth: true,
  });
};
export const uploadPostMedia = async (
  postId: string,
  asset: ImagePickerAsset,
) => {
  const formData = new FormData();

  const extension = asset.mimeType?.split("/")[1] ?? "jpg";

  formData.append("file", {
    uri: asset.uri,
    name: asset.fileName ?? `post-${Date.now()}.${extension}`,
    type: asset.mimeType ?? "image/jpeg",
  } as any);

  return await api<PostMediaUploadResponse>(`/posts/${postId}/media`, {
    method: "POST",
    auth: true,
    body: formData,
  });
};
const createMediaFormData = (asset: ImagePickerAsset) => {
  const formData = new FormData();

  const extension = asset.mimeType?.split("/")[1] ?? "jpg";

  formData.append("file", {
    uri: asset.uri,
    name: asset.fileName ?? `post-${Date.now()}.${extension}`,
    type: asset.mimeType ?? "image/jpeg",
  } as any);

  return formData;
};
export const updatePostMedia = async (
  postId: string,
  mediaId: string,
  asset: ImagePickerAsset,
) => {
  return await api<PostMediaUploadResponse>(
    `/posts/${postId}/media/${mediaId}`,
    {
      method: "PUT",
      auth: true,
      body: createMediaFormData(asset),
    },
  );
};

export const deletePostMedia = async (postId: string, mediaId: string) => {
  return await api<void>(`/posts/${postId}/media/${mediaId}`, {
    method: "DELETE",
    auth: true,
  });
};
