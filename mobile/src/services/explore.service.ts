import { api } from "@/services/api";
import type { FeedPostDto } from "@/types/feed";
import type { GroupDto } from "@/types/group";
import type { UserSummaryDto } from "@/types/user";

export type ExploreSection = "posts" | "groups" | "users";
export type ExploreSort = "recommended" | "latest";
export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

const query = (
  page: number,
  search: string,
  sort: ExploreSort,
  sportId?: string | null,
) => {
  const value = new URLSearchParams({
    page: page.toString(),
    pageSize: "20",
    sort,
  });
  if (search.trim()) value.set("search", search.trim());
  if (sportId) value.set("sportId", sportId);
  return value.toString();
};

export const getExplorePosts = (
  page: number,
  search: string,
  sort: ExploreSort,
  sportId?: string | null,
) =>
  api<PagedResponse<FeedPostDto>>(
    `/explore/posts?${query(page, search, sort, sportId)}`,
    { auth: true },
  );
export const getExploreGroups = (
  page: number,
  search: string,
  sort: ExploreSort,
) =>
  api<PagedResponse<GroupDto>>(`/explore/groups?${query(page, search, sort)}`, {
    auth: true,
  });
export const getExploreUsers = (
  page: number,
  search: string,
  sort: ExploreSort,
) =>
  api<PagedResponse<UserSummaryDto>>(
    `/explore/users?${query(page, search, sort)}`,
    { auth: true },
  );
