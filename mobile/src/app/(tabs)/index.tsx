import AppHeader from "@/components/AppHeader";
import CreatePostPrompt from "@/components/CreatePostPrompt";
import PostCard from "@/components/PostCard";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import { getFeed } from "@/services/feed.service";
import type { Post } from "@/types/post";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatRelativeTime } from "@/utils/date";
import { useAuth } from "@/contexts/AuthContext";
export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { user: currentUser } = useAuth();
  const currentUserIdRef = useRef<string | undefined>(currentUser?.id);
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();
  useEffect(() => {
    if (!currentUser?.id) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setPosts([]);
    setErrorMessage("");
    setLoading(true);

    loadFeed(currentUser.id);
  }, [currentUser?.id, refresh]);
  const loadFeed = async (userId: string) => {
    try {
      setErrorMessage("");

      const response = await getFeed(20);

      if (currentUserIdRef.current !== userId) {
        return;
      }

      setPosts(
        response.items.map((item) => {
          const firstImage = item.media.find((media) => media.mediaType === 1);

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
      if (currentUserIdRef.current !== userId) {
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : "Không thể tải bảng tin.",
      );
    } finally {
      if (currentUserIdRef.current === userId) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!currentUser?.id) {
      setPosts([]);
      setErrorMessage("");
      setLoading(false);
      return;
    }

    setPosts([]);
    setErrorMessage("");
    setLoading(true);

    loadFeed(currentUser.id);
  }, [currentUser?.id]);

  const handleRefresh = async () => {
    if (!currentUser?.id) return;

    setRefreshing(true);

    await loadFeed(currentUser.id);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader />

        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang tải bảng tin...
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />

      <FlatList
        data={posts}
        extraData={currentUser?.id}
        keyExtractor={(item) => `${currentUser?.id}-${item.id}`}
        ListHeaderComponent={
          <>
            <CreatePostPrompt />

            {errorMessage ? (
              <View style={styles.errorBox}>
                <AppText color={COLORS.danger}>{errorMessage}</AppText>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !errorMessage ? (
            <View style={styles.center}>
              <AppText color={COLORS.textMuted}>
                Chưa có bài viết nào trên bảng tin.
              </AppText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() =>
              router.push({
                pathname: "/post/[id]",
                params: {
                  id: item.id,
                },
              })
            }
            onCommentPress={() =>
              router.push({
                pathname: "/post/[id]",
                params: {
                  id: item.id,
                },
              })
            }
            onAuthorPress={() =>
              router.push({
                pathname: "/user/[id]",
                params: {
                  id: item.authorId,
                },
              })
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  center: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },

  message: {
    marginTop: SPACING.md,
  },

  errorBox: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 10,
  },
});
