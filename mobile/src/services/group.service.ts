import { api } from "@/services/api";
import type {
  GroupDto,
  GroupMemberDto,
  GroupPostsResponse,
  GroupsResponse,
} from "@/types/group";

export const joinGroup = async (id: string) => {
  return await api<GroupMemberDto>(`/groups/${id}/join`, {
    method: "POST",
    auth: true,
  });
};

export const leaveGroup = async (id: string) => {
  await api<void>(`/groups/${id}/leave`, {
    method: "DELETE",
    auth: true,
  });
};

export const getGroups = async (
  search: string,
  limit = 20,
  cursor?: string | null,
) => {
  const query = new URLSearchParams({ limit: limit.toString() });

  if (search) query.append("search", search);
  if (cursor) query.append("cursor", cursor);

  return await api<GroupsResponse>(`/groups?${query.toString()}`, {
    method: "GET",
    auth: true,
  });
};

export const getGroupById = async (id: string) => {
  return await api<GroupDto>(`/groups/${id}`, {
    method: "GET",
    auth: true,
  });
};

export const getGroupPosts = async (
  id: string,
  limit = 20,
  cursor?: string | null,
) => {
  const query = new URLSearchParams({ limit: limit.toString() });

  if (cursor) query.append("cursor", cursor);

  return await api<GroupPostsResponse>(
    `/groups/${id}/posts?${query.toString()}`,
    {
      method: "GET",
      auth: true,
    },
  );
};
