import PostCard from "@/components/PostCard";
import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { mapFeedPostToPost } from "@/mappers/post.mapper";
import { getFeed } from "@/services/feed.service";
import type { Post } from "@/types/post";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 20;

export default function ExploreScreen() {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const currentUserIdRef = useRef<string | undefined>(currentUser?.id);
  const loadingMoreRef = useRef(false);

  const loadPosts = useCallback(
    async (userId: string, cursor: string | null = null, append = false) => {
      try {
        if (!append) setErrorMessage("");
        const response = await getFeed(PAGE_SIZE, cursor);

        if (currentUserIdRef.current !== userId) return;

        const mappedPosts = response.items.map(mapFeedPostToPost);
        setPosts((current) => {
          if (!append) return mappedPosts;
          const existingIds = new Set(current.map((post) => post.id));
          return [
            ...current,
            ...mappedPosts.filter((post) => !existingIds.has(post.id)),
          ];
        });
        setNextCursor(response.nextCursor ?? null);
      } catch (error) {
        if (currentUserIdRef.current !== userId) return;
        if (!append) setPosts([]);
        setErrorMessage(
          error instanceof Error ? error.message : "Không thể tải bài viết.",
        );
      } finally {
        if (currentUserIdRef.current === userId) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [],
  );

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
        setNextCursor(null);
        setLoading(true);
      }

      void loadPosts(currentUser.id);
    }, [currentUser?.id, loadPosts]),
  );

  const handleRefresh = () => {
    if (!currentUser?.id) return;
    setRefreshing(true);
    void loadPosts(currentUser.id);
  };

  const handleLoadMore = () => {
    if (!currentUser?.id || !nextCursor || loading || refreshing || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    void loadPosts(currentUser.id, nextCursor, true);
  };

  const openPost = (postId: string) =>
    router.push({ pathname: "/post/[id]", params: { id: postId } });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <AppText variant="title">Khám phá</AppText>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <AppText color={COLORS.textMuted}>Đang tải bài viết...</AppText>
        </View>
      ) : errorMessage && posts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <AppText color={COLORS.textMuted} style={styles.message}>{errorMessage}</AppText>
          {currentUser?.id ? (
            <Pressable style={styles.retryButton} onPress={() => {
              setLoading(true);
              void loadPosts(currentUser.id);
            }}>
              <AppText variant="label" color={COLORS.background}>Thử lại</AppText>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={posts}
          extraData={currentUser?.id}
          keyExtractor={(item) => `${currentUser?.id}-${item.id}`}
          ListHeaderComponent={errorMessage ? (
            <View style={styles.errorBox}><AppText color={COLORS.danger}>{errorMessage}</AppText></View>
          ) : null}
          ListEmptyComponent={
            <View style={styles.center}><AppText color={COLORS.textMuted}>Chưa có bài viết nào để khám phá.</AppText></View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => openPost(item.id)}
              onCommentPress={() => openPost(item.id)}
              onAuthorPress={() => router.push({ pathname: "/user/[id]", params: { id: item.authorId } })}
              onDeleted={(postId) => setPosts((current) => current.filter((post) => post.id !== postId))}
            />
          )}
          ListFooterComponent={loadingMore ? (
            <View style={styles.footer}><ActivityIndicator color={COLORS.primary} /></View>
          ) : null}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
    minHeight: 180,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  message: { textAlign: "center" },
  retryButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  errorBox: {
    margin: SPACING.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.md,
  },
  footer: { padding: SPACING.lg, alignItems: "center" },
});
