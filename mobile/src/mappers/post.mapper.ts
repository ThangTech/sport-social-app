import { getFileUrl } from "@/services/api";
import type { FeedPostDto } from "@/types/feed";
import type { Post } from "@/types/post";
import { formatRelativeTime } from "@/utils/date";

export const mapFeedPostToPost = (item: FeedPostDto): Post => {
  const firstImage = item.media.find((media) => media.mediaType === 1);

  return {
    id: item.id,
    authorId: item.authorId,
    authorName: item.authorName,
    authorAvatar: item.authorAvatar
      ? { uri: getFileUrl(item.authorAvatar)! }
      : require("@/assets/images/icon.png"),
    groupId: item.groupId ?? undefined,
    groupName: item.groupName ?? undefined,
    createdAt: formatRelativeTime(item.createdAt),
    content: item.content ?? "",
    visibility: item.visibility,
    image: firstImage ? { uri: getFileUrl(firstImage.url)! } : undefined,
    sport: item.sportName ?? undefined,
    likeCount: item.likeCount,
    commentCount: item.commentCount,
    currentReaction: item.currentReaction,
    isSaved: item.isSaved,
  };
};
