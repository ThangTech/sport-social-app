import AppText from "@/components/ui/AppText";
import ProfilePostList from "@/components/profile/ProfilePostList";
import ProfileSummary from "@/components/profile/ProfileSummary";
import { COLORS, SPACING } from "@/constants/theme";
import { mapFeedPostToPost } from "@/mappers/post.mapper";
import {
  getUserPosts,
  getUserProfile,
  followUser,
  unfollowUser,
} from "@/services/user.service";
import { useAuth } from "@/contexts/AuthContext";
import type { Post } from "@/types/post";
import type { UserProfileDto } from "@/types/user";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
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

      const [profileResult, postsResult] = await Promise.all([
        getUserProfile(id),
        getUserPosts(id),
      ]);

      setUser(profileResult);

      setPosts(postsResult.map(mapFeedPostToPost));
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

});
