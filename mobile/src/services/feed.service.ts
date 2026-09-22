import { api } from "@/services/api";
import type { FeedResponse } from "@/types/feed";

export const getFeed = async (limit = 20, cursor?: string | null) => {
  const query = new URLSearchParams({
    limit: limit.toString(),
  });

  if (cursor) {
    query.append("cursor", cursor);
  }

  return await api<FeedResponse>(`/feed?${query.toString()}`, {
    method: "GET",
    auth: true,
  });
};
