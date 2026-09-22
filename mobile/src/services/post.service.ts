import { api } from "@/services/api";
import type { FeedPostDto } from "@/types/feed";

export const getPostById = async (id: string) => {
  return await api<FeedPostDto>(
    `/posts/${id}`,
    {
      method: "GET",
      auth: true,
    },
  );
};