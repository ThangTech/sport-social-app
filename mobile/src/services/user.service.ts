import { api } from "@/services/api";
import type { FeedPostDto } from "@/types/feed";
import type {
  UpdateProfileRequest,
  UserProfileDto,
  UserSummaryDto,
} from "@/types/user";
import type { ImagePickerAsset } from "expo-image-picker";

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

export const updateMyProfile = async (request: UpdateProfileRequest) => {
  return await api<UserProfileDto>("/users/me", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(request),
  });
};

const createProfileImageFormData = (
  asset: ImagePickerAsset,
  filePrefix: string,
) => {
  const formData = new FormData();
  const extension = asset.mimeType?.split("/")[1] ?? "jpg";

  formData.append("file", {
    uri: asset.uri,
    name: asset.fileName ?? `${filePrefix}-${Date.now()}.${extension}`,
    type: asset.mimeType ?? "image/jpeg",
  } as any);

  return formData;
};

export const updateMyAvatar = async (asset: ImagePickerAsset) => {
  return await api<UserProfileDto>("/users/me/avatar", {
    method: "PUT",
    auth: true,
    body: createProfileImageFormData(asset, "avatar"),
  });
};

export const deleteMyAvatar = async () => {
  return await api<UserProfileDto>("/users/me/avatar", {
    method: "DELETE",
    auth: true,
  });
};

export const updateMyCover = async (asset: ImagePickerAsset) => {
  return await api<UserProfileDto>("/users/me/cover", {
    method: "PUT",
    auth: true,
    body: createProfileImageFormData(asset, "cover"),
  });
};

export const deleteMyCover = async () => {
  return await api<UserProfileDto>("/users/me/cover", {
    method: "DELETE",
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

export const blockUser = async (id: string) => {
  return await api<void>(`/users/${id}/block`, {
    method: "POST",
    auth: true,
  });
};

export const unblockUser = async (id: string) => {
  return await api<void>(`/users/${id}/block`, {
    method: "DELETE",
    auth: true,
  });
};

export const getBlockedUsers = async () => {
  return await api<UserSummaryDto[]>("/users/me/blocked-users", {
    method: "GET",
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
