import { api } from "@/services/api";
import type { NotificationsResponse } from "@/types/notification";

export const getNotifications = async (limit = 20, cursor?: string | null) => {
  const query = new URLSearchParams({ limit: limit.toString() });
  if (cursor) query.append("cursor", cursor);
  return await api<NotificationsResponse>(`/notifications?${query.toString()}`, { auth: true });
};

export const getUnreadNotificationCount = async () =>
  await api<{ count: number }>("/notifications/unread-count", { auth: true });

export const markNotificationRead = async (id: string) => {
  await api<void>(`/notifications/${id}/read`, { method: "PATCH", auth: true });
};

export const markAllNotificationsRead = async () => {
  await api<void>("/notifications/read-all", { method: "PATCH", auth: true });
};
