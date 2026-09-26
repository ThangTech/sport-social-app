import ProfilePostList from "@/components/profile/ProfilePostList";
import ProfileSummary from "@/components/profile/ProfileSummary";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { mapFeedPostToPost } from "@/mappers/post.mapper";
import { getUserPosts, getUserProfile } from "@/services/user.service";
import type { Post } from "@/types/post";
import type { UserProfileDto } from "@/types/user";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user: currentUser, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadProfile = useCallback(async () => {
    if (!currentUser?.id) {
      setProfile(null);
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      setErrorMessage("");
      const [profileResult, postsResult] = await Promise.all([
        getUserProfile(currentUser.id),
        getUserPosts(currentUser.id),
      ]);

      setProfile(profileResult);
      setPosts(postsResult.map(mapFeedPostToPost));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải trang cá nhân.",
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const openConnections = (type: "followers" | "following") => {
    if (!profile) return;

    router.push({
      pathname: "/user/connections",
      params: { id: profile.id, type },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <AppText variant="title">Trang cá nhân</AppText>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang tải trang cá nhân...
          </AppText>
        </View>
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
          <Pressable style={styles.retryButton} onPress={loadProfile}>
            <AppText color={COLORS.background}>Thử lại</AppText>
          </Pressable>
        </View>
      ) : profile ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <ProfileSummary
            profile={profile}
            postCount={posts.length}
            onFollowersPress={() => openConnections("followers")}
            onFollowingPress={() => openConnections("following")}
          />

          <Pressable
            style={styles.editButton}
            onPress={() => router.push("/user/edit-profile")}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={COLORS.text}
            />
            <AppText variant="label">Chỉnh sửa hồ sơ</AppText>
          </Pressable>

          <View style={styles.menuSection}>
            <Pressable
              style={styles.menuItem}
              onPress={() => router.push("/post/saved-posts")}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons
                    name="bookmark-outline"
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
                <AppText variant="label">Bài viết đã lưu</AppText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textMuted}
              />
            </Pressable>

            <Pressable onPress={signOut} style={styles.logoutButton}>
              <Ionicons
                name="log-out-outline"
                size={20}
                color={COLORS.danger}
              />
              <AppText variant="label" color={COLORS.danger}>
                Đăng xuất
              </AppText>
            </Pressable>
          </View>

          <ProfilePostList
            posts={posts}
            emptyMessage="Bạn chưa có bài viết nào."
            onPostPress={(postId) =>
              router.push({
                pathname: "/post/[id]",
                params: { id: postId },
              })
            }
            onPostDeleted={(postId) =>
              setPosts((current) =>
                current.filter((post) => post.id !== postId),
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
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
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
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  editButton: {
    alignSelf: "center",
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
  },
  menuSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  menuItem: {
    minHeight: 64,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceAlt,
  },
  logoutButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
  },
});
