import AppText from "@/components/ui/AppText";
import ProfilePostList from "@/components/profile/ProfilePostList";
import ProfileSummary from "@/components/profile/ProfileSummary";
import { COLORS, SPACING } from "@/constants/theme";
import { mapFeedPostToPost } from "@/mappers/post.mapper";
import {
  blockUser,
  getUserPosts,
  getUserProfile,
  followUser,
  unblockUser,
  unfollowUser,
} from "@/services/user.service";
import { useAuth } from "@/contexts/AuthContext";
import type { Post } from "@/types/post";
import type { UserProfileDto } from "@/types/user";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  const { showActionSheetWithOptions } = useActionSheet();

  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [user, setUser] = useState<UserProfileDto | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [postsErrorMessage, setPostsErrorMessage] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const loadedUserIdRef = useRef<string | undefined>(undefined);

  const loadProfile = useCallback(async () => {
    if (!id) {
      setErrorMessage("Không tìm thấy người dùng.");
      setLoading(false);
      return;
    }

    try {
      setNotFound(false);
      setErrorMessage("");
      setPostsErrorMessage("");

      const profileResult = await getUserProfile(id);

      setUser(profileResult);

      try {
        const postsResult = await getUserPosts(id);

        setPosts(postsResult.map(mapFeedPostToPost));
      } catch (error) {
        setPosts([]);
        setPostsErrorMessage(
          error instanceof ApiError && error.status === 403
            ? "Bạn không thể xem bài viết của người dùng này."
            : error instanceof Error
              ? error.message
              : "Không thể tải bài viết.",
        );
      }
    } catch (error) {
      setUser(null);
      setPosts([]);

      if (error instanceof ApiError && error.status === 404) {
        setNotFound(true);
        return;
      }

      setErrorMessage(
        error instanceof ApiError && error.status === 403
          ? "Bạn không thể xem trang cá nhân này vì quyền truy cập đã thay đổi."
          : error instanceof Error
            ? error.message
            : "Không thể tải thông tin người dùng.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setErrorMessage("Không tìm thấy người dùng.");

        setLoading(false);
        return;
      }

      const isNewUser = loadedUserIdRef.current !== id;

      if (isNewUser) {
        loadedUserIdRef.current = id;

        setLoading(true);
        setUser(null);
        setPosts([]);
      }

      loadProfile();
    }, [id, loadProfile]),
  );

  const handleFollow = async () => {
    if (
      !user ||
      followLoading ||
      blockLoading ||
      user.isBlockedByCurrentUser
    ) {
      return;
    }

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
      Alert.alert(
        "Không thể cập nhật theo dõi",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const updateBlockStatus = async (shouldBlock: boolean) => {
    if (!user || blockLoading || followLoading) return;

    try {
      setBlockLoading(true);
      await (shouldBlock ? blockUser(user.id) : unblockUser(user.id));

      setUser((current) =>
        current
          ? {
              ...current,
              isFollowing: shouldBlock ? false : current.isFollowing,
              isBlockedByCurrentUser: shouldBlock,
            }
          : current,
      );

      await loadProfile();
    } catch (error) {
      Alert.alert(
        shouldBlock ? "Không thể chặn người dùng" : "Không thể bỏ chặn",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setBlockLoading(false);
    }
  };

  const confirmBlock = () => {
    if (!user || blockLoading || followLoading) return;

    Alert.alert(
      "Chặn người dùng",
      `Bạn có chắc muốn chặn ${user.displayName}? Hai tài khoản sẽ không còn theo dõi nhau.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Chặn",
          style: "destructive",
          onPress: () => updateBlockStatus(true),
        },
      ],
    );
  };

  const openUserMenu = () => {
    if (!user || blockLoading || followLoading) return;

    const blockLabel = user.isBlockedByCurrentUser
      ? "Bỏ chặn"
      : "Chặn người dùng";

    showActionSheetWithOptions(
      {
        options: [blockLabel, "Hủy"],
        cancelButtonIndex: 1,
        destructiveButtonIndex: user.isBlockedByCurrentUser ? undefined : 0,
        title: "Tùy chọn người dùng",
      },
      (index) => {
        if (index !== 0) return;

        if (user.isBlockedByCurrentUser) {
          updateBlockStatus(false);
        } else {
          confirmBlock();
        }
      },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Trang cá nhân</AppText>

        {user && currentUser?.id !== user.id ? (
          <Pressable
            disabled={blockLoading || followLoading}
            onPress={openUserMenu}
            style={styles.backButton}
          >
            {blockLoading ? (
              <ActivityIndicator size="small" color={COLORS.text} />
            ) : (
              <Ionicons
                name="ellipsis-horizontal"
                size={24}
                color={COLORS.text}
              />
            )}
          </Pressable>
        ) : (
          <View style={styles.headerSpace} />
        )}
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
          <ProfileSummary
            profile={user}
            postCount={posts.length}
            onFollowersPress={() =>
              router.push({
                pathname: "/user/connections",
                params: { id: user.id, type: "followers" },
              })
            }
            onFollowingPress={() =>
              router.push({
                pathname: "/user/connections",
                params: { id: user.id, type: "following" },
              })
            }
          />

          {currentUser?.id !== user.id && user.isBlockedByCurrentUser ? (
            <Pressable
              disabled={blockLoading}
              onPress={() => updateBlockStatus(false)}
              style={[
                styles.blockedButton,
                blockLoading && styles.disabledButton,
              ]}
            >
              {blockLoading ? (
                <ActivityIndicator size="small" color={COLORS.text} />
              ) : (
                <Ionicons
                  name="ban-outline"
                  size={18}
                  color={COLORS.textMuted}
                />
              )}

              <AppText color={COLORS.textMuted}>Đã chặn · Bỏ chặn</AppText>
            </Pressable>
          ) : currentUser?.id !== user.id ? (
            <Pressable
              disabled={followLoading || blockLoading}
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

          {postsErrorMessage ? (
            <AppText color={COLORS.textMuted} style={styles.postsError}>
              {postsErrorMessage}
            </AppText>
          ) : (
            <ProfilePostList
              posts={posts}
              emptyMessage="Người dùng này chưa có bài viết."
              onPostPress={(postId) =>
                router.push({
                  pathname: "/post/[id]",
                  params: { id: postId },
                })
              }
              onPostDeleted={(postId) =>
                setPosts((current) =>
                  current.filter((item) => item.id !== postId),
                )
              }
            />
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

  followButton: {
    alignSelf: "center",
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

  blockedButton: {
    alignSelf: "center",
    marginTop: 22,
    minWidth: 180,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  postsError: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    textAlign: "center",
  },
});
