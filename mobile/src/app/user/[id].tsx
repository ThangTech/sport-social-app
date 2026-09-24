import PostCard from "@/components/PostCard";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import {
  getUserPosts,
  getUserProfile,
  followUser,
  unfollowUser,
} from "@/services/user.service";
import { useAuth } from "@/contexts/AuthContext";
import type { Post } from "@/types/post";
import type { UserProfileDto } from "@/types/user";
import { formatRelativeTime } from "@/utils/date";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import UserNotFound from "@/components/UserNotFound";
import { ApiError } from "@/types/api";

export default function UserProfileScreen() {
  const { user: currentUser } = useAuth();

  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [user, setUser] = useState<UserProfileDto | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setNotFound(false);
    const loadProfile = async () => {
      if (!id) {
        setErrorMessage("Không tìm thấy người dùng.");
        setLoading(false);
        return;
      }

      try {
        setErrorMessage("");

        const [profileResult, postsResult] = await Promise.all([
          getUserProfile(id),
          getUserPosts(id),
        ]);

        setUser(profileResult);

        setPosts(
          postsResult.map((item) => {
            const firstImage = item.media.find(
              (media) => media.mediaType === 1,
            );

            return {
              id: item.id,
              authorId: item.authorId,
              authorName: item.authorName,

              authorAvatar: item.authorAvatar
                ? {
                    uri: getFileUrl(item.authorAvatar)!,
                  }
                : require("@/assets/images/icon.png"),

              groupId: item.groupId ?? undefined,

              groupName: item.groupName ?? undefined,

              createdAt: formatRelativeTime(item.createdAt),

              content: item.content ?? "",
              visibility: item.visibility,
              image: firstImage
                ? {
                    uri: getFileUrl(firstImage.url)!,
                  }
                : undefined,

              sport: item.sportName ?? undefined,

              likeCount: item.likeCount,

              commentCount: item.commentCount,
              currentReaction: item.currentReaction,
              isSaved: item.isSaved,
            };
          }),
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải thông tin người dùng.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  const handleFollow = async () => {
    if (!user || followLoading) return;

    try {
      setFollowLoading(true);

      if (user.isFollowing) {
        await unfollowUser(user.id);

        setUser((current) =>
          current
            ? {
                ...current,
                isFollowing: false,
                followerCount: Math.max(0, current.followerCount - 1),
              }
            : current,
        );
      } else {
        await followUser(user.id);

        setUser((current) =>
          current
            ? {
                ...current,
                isFollowing: true,
                followerCount: current.followerCount + 1,
              }
            : current,
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể cập nhật theo dõi.",
      );
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Trang cá nhân</AppText>

        <View style={styles.headerSpace} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang tải trang cá nhân...
          </AppText>
        </View>
      ) : notFound ? (
        <UserNotFound />
      ) : errorMessage ? (
        <View style={styles.center}>
          <Ionicons
            name="person-circle-outline"
            size={52}
            color={COLORS.textMuted}
          />

          <AppText color={COLORS.textMuted} style={styles.message}>
            {errorMessage}
          </AppText>
        </View>
      ) : user ? (
        <ScrollView>
          {user.coverUrl ? (
            <Image
              source={{
                uri: getFileUrl(user.coverUrl)!,
              }}
              style={styles.cover}
            />
          ) : null}

          <View
            style={[
              styles.profile,
              !user.coverUrl && styles.profileWithoutCover,
            ]}
          >
            <Image
              source={
                user.avatarUrl
                  ? {
                      uri: getFileUrl(user.avatarUrl)!,
                    }
                  : require("@/assets/images/icon.png")
              }
              style={[
                styles.avatar,
                !user.coverUrl && styles.avatarWithoutCover,
              ]}
            />

            <AppText variant="subtitle">{user.displayName}</AppText>

            <AppText style={styles.username}>@{user.userName}</AppText>

            {user.bio ? <AppText style={styles.bio}>{user.bio}</AppText> : null}

            <View style={styles.stats}>
              <View style={styles.statItem}>
                <AppText variant="subtitle">{posts.length}</AppText>

                <AppText style={styles.statLabel}>Bài viết</AppText>
              </View>

              <Pressable
                style={styles.statItem}
                onPress={() =>
                  router.push({
                    pathname: "/user/connections",
                    params: {
                      id: user.id,
                      type: "followers",
                    },
                  })
                }
              >
                <AppText variant="subtitle">{user.followerCount}</AppText>

                <AppText style={styles.statLabel}>Người theo dõi</AppText>
              </Pressable>

              <Pressable
                style={styles.statItem}
                onPress={() =>
                  router.push({
                    pathname: "/user/connections",
                    params: {
                      id: user.id,
                      type: "following",
                    },
                  })
                }
              >
                <AppText variant="subtitle">{user.followingCount}</AppText>

                <AppText style={styles.statLabel}>Đang theo dõi</AppText>
              </Pressable>
            </View>

            {currentUser?.id !== user.id ? (
              <Pressable
                disabled={followLoading}
                onPress={handleFollow}
                style={[
                  styles.followButton,
                  user.isFollowing && styles.followingButton,
                  followLoading && styles.disabledButton,
                ]}
              >
                {followLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={user.isFollowing ? COLORS.text : COLORS.background}
                  />
                ) : (
                  <>
                    <Ionicons
                      name={
                        user.isFollowing ? "checkmark" : "person-add-outline"
                      }
                      size={18}
                      color={user.isFollowing ? COLORS.text : COLORS.background}
                    />

                    <AppText
                      style={[
                        styles.followText,
                        user.isFollowing && styles.followingText,
                      ]}
                    >
                      {user.isFollowing ? "Đang theo dõi" : "Theo dõi"}
                    </AppText>
                  </>
                )}
              </Pressable>
            ) : null}
          </View>

          <View style={styles.postsSection}>
            <AppText variant="subtitle">Bài viết</AppText>

            <AppText variant="caption" color={COLORS.textMuted}>
              {posts.length} bài viết
            </AppText>
          </View>

          {posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <AppText color={COLORS.textMuted}>
                Người dùng này chưa có bài viết.
              </AppText>
            </View>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPress={() =>
                  router.push({
                    pathname: "/post/[id]",
                    params: {
                      id: post.id,
                    },
                  })
                }
              />
            ))
          )}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    height: 64,
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerSpace: {
    width: 40,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },

  message: {
    marginTop: SPACING.md,
    textAlign: "center",
  },

  profile: {
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },

  profileWithoutCover: {
    paddingTop: SPACING.xl,
  },

  cover: {
    width: "100%",
    height: 150,
    backgroundColor: COLORS.surfaceAlt,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginTop: -48,
    marginBottom: SPACING.md,
    borderWidth: 4,
    borderColor: COLORS.background,
  },

  avatarWithoutCover: {
    marginTop: 0,
  },

  username: {
    marginTop: 4,
    color: COLORS.textMuted,
  },

  bio: {
    marginTop: SPACING.md,
    textAlign: "center",
  },

  stats: {
    width: "100%",
    marginTop: 20,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statLabel: {
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
  },

  followButton: {
    marginTop: 22,
    minWidth: 180,
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  followText: {
    color: COLORS.background,
    fontWeight: "600",
  },

  followingButton: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  followingText: {
    color: COLORS.text,
  },

  disabledButton: {
    opacity: 0.6,
  },

  postsSection: {
    padding: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },

  emptyPosts: {
    padding: SPACING.xl,
    alignItems: "center",
  },
});
