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
  const { user: currentUser } = useAuth();
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
            onAvatarPress={() => router.push("/user/settings")}
            onEditPress={() => router.push("/user/edit-profile")}
          />

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
    alignItems: "center",
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
});
