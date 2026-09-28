import { api } from "@/services/api";
import type {
  GroupDto,
  GroupMemberDto,
  GroupPostsResponse,
  GroupsResponse,
  SaveGroupRequest,
  UpdateGroupMemberRoleRequest,
} from "@/types/group";

export const createGroup = async (request: SaveGroupRequest) => {
  return await api<GroupDto>("/groups", {
    method: "POST",
    auth: true,
    body: JSON.stringify(request),
  });
};

export const updateGroup = async (id: string, request: SaveGroupRequest) => {
  return await api<GroupDto>(`/groups/${id}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(request),
  });
};

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

export const getGroupJoinRequests = async (id: string) => {
  return await api<GroupMemberDto[]>(`/groups/${id}/join-requests`, {
    method: "GET",
    auth: true,
  });
};

export const approveGroupJoinRequest = async (
  id: string,
  userId: string,
) => {
  await api<void>(`/groups/${id}/join-requests/${userId}/approve`, {
    method: "POST",
    auth: true,
  });
};

export const rejectGroupJoinRequest = async (
  id: string,
  userId: string,
) => {
  await api<void>(`/groups/${id}/join-requests/${userId}`, {
    method: "DELETE",
    auth: true,
  });
};

export const getGroupMembers = async (id: string) => {
  return await api<GroupMemberDto[]>(`/groups/${id}/members`, {
    method: "GET",
    auth: true,
  });
};

export const updateGroupMemberRole = async (
  id: string,
  userId: string,
  request: UpdateGroupMemberRoleRequest,
) => {
  await api<void>(`/groups/${id}/members/${userId}/role`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(request),
  });
};

export const removeGroupMember = async (id: string, userId: string) => {
  await api<void>(`/groups/${id}/members/${userId}`, {
    method: "DELETE",
    auth: true,
  });
};

export const banGroupMember = async (id: string, userId: string) => {
  await api<void>(`/groups/${id}/members/${userId}/ban`, {
    method: "POST",
    auth: true,
  });
};

export const getBannedGroupMembers = async (id: string) => {
  return await api<GroupMemberDto[]>(`/groups/${id}/members/banned`, {
    method: "GET",
    auth: true,
  });
};

export const unbanGroupMember = async (id: string, userId: string) => {
  await api<void>(`/groups/${id}/members/${userId}/ban`, {
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
