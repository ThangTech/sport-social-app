import AppHeader from "@/components/AppHeader";
import CreatePostPrompt from "@/components/CreatePostPrompt";
import PostCard from "@/components/PostCard";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFeed } from "@/services/feed.service";
import { mapFeedPostToPost } from "@/mappers/post.mapper";
import type { Post } from "@/types/post";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useRef, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { user: currentUser } = useAuth();
  const currentUserIdRef = useRef<string | undefined>(currentUser?.id);
  const loadingMoreRef = useRef(false);
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();

  const loadFeed = async (
    userId: string,
    cursor: string | null = null,
    append = false,
  ) => {
    try {
      if (!append) {
        setErrorMessage("");
      }

      const response = await getFeed(20, cursor);

      if (currentUserIdRef.current !== userId) {
        return;
      }

      const mappedPosts = response.items.map(mapFeedPostToPost);

      setPosts((current) => {
        if (!append) return mappedPosts;

        const existingIds = new Set(current.map((post) => post.id));
        const newPosts = mappedPosts.filter((post) => !existingIds.has(post.id));

        return [...current, ...newPosts];
      });
      setNextCursor(response.nextCursor ?? null);
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
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    }
  };
  useFocusEffect(
    useCallback(() => {
      const previousUserId = currentUserIdRef.current;

      currentUserIdRef.current = currentUser?.id;

      if (!currentUser?.id) {
        setPosts([]);
        setNextCursor(null);
        setErrorMessage("");
        setLoading(false);
        return;
      }

      if (previousUserId !== currentUser.id) {
        setPosts([]);
        setLoading(true);
      }

      loadFeed(currentUser.id);
    }, [currentUser?.id, refresh]),
  );
  const handleRefresh = async () => {
    if (!currentUser?.id) return;

    setRefreshing(true);

    await loadFeed(currentUser.id);
  };

  const handleLoadMore = async () => {
    if (
      !currentUser?.id ||
      !nextCursor ||
      loading ||
      refreshing ||
      loadingMoreRef.current
    ) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);
    await loadFeed(currentUser.id, nextCursor, true);
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
            onDeleted={(postId) => {
              setPosts((current) =>
                current.filter((post) => post.id !== postId),
              );
            }}
          />
        )}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.listFooter}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
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
  listFooter: {
    padding: SPACING.lg,
    alignItems: "center",
  },
});
