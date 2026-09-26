import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import { getPostReactions } from "@/services/post.service";
import type { PostReactionDto } from "@/types/post";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 20;

export default function PostReactionsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const postId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [items, setItems] = useState<PostReactionDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");

  const requestInFlightRef = useRef(false);

  const loadReactions = useCallback(
    async (cursor: string | null = null, append = false) => {
      if (!postId || requestInFlightRef.current) return;

      requestInFlightRef.current = true;

      if (append) {
        setLoadingMore(true);
        setLoadMoreError("");
      } else {
        setLoading(true);
        setErrorMessage("");
        setLoadMoreError("");
      }

      try {
        const response = await getPostReactions(postId, PAGE_SIZE, cursor);

        setItems((current) => {
          if (!append) return response.items;

          const existingUserIds = new Set(
            current.map((reaction) => reaction.userId),
          );
          const newItems = response.items.filter(
            (reaction) => !existingUserIds.has(reaction.userId),
          );

          return [...current, ...newItems];
        });
        setNextCursor(response.nextCursor ?? null);
        setErrorMessage("");
        setLoadMoreError("");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách người thả tim.";

        if (append) {
          setLoadMoreError(message);
        } else {
          setErrorMessage(message);
        }
      } finally {
        requestInFlightRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [postId],
  );

  useFocusEffect(
    useCallback(() => {
      setItems([]);
      setNextCursor(null);
      setLoadMoreError("");

      if (!postId) {
        setErrorMessage("Không tìm thấy bài viết.");
        setLoading(false);
        return;
      }

      loadReactions();
    }, [postId, loadReactions]),
  );

  const handleLoadMore = () => {
    if (
      !nextCursor ||
      loading ||
      loadingMore ||
      loadMoreError ||
      requestInFlightRef.current
    ) {
      return;
    }

    loadReactions(nextCursor, true);
  };

  const renderReaction = ({ item }: { item: PostReactionDto }) => (
    <Pressable
      style={styles.userRow}
      onPress={() =>
        router.push({
          pathname: "/user/[id]",
          params: { id: item.userId },
        })
      }
    >
      <Image
        source={
          item.avatarUrl
            ? { uri: getFileUrl(item.avatarUrl)! }
            : require("@/assets/images/icon.png")
        }
        style={styles.avatar}
      />

      <AppText variant="label" style={styles.displayName}>
        {item.displayName || "Người dùng"}
      </AppText>

      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Người đã thả tim</AppText>

        <View style={styles.headerSpace} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang tải danh sách...
          </AppText>
        </View>
      ) : errorMessage && items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={46}
            color={COLORS.textMuted}
          />
          <AppText color={COLORS.textMuted} style={styles.message}>
            {errorMessage}
          </AppText>
          <Pressable style={styles.retryButton} onPress={() => loadReactions()}>
            <AppText color={COLORS.background}>Thử lại</AppText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.userId}
          renderItem={renderReaction}
          contentContainerStyle={
            items.length === 0 ? styles.emptyList : undefined
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="heart-outline"
                size={48}
                color={COLORS.textMuted}
              />
              <AppText color={COLORS.textMuted} style={styles.message}>
                Chưa có ai thả tim bài viết này.
              </AppText>
            </View>
          }
          ListFooterComponent={
            <>
              {loadMoreError ? (
                <View style={styles.inlineError}>
                  <AppText variant="caption" color={COLORS.danger}>
                    {loadMoreError}
                  </AppText>
                  <Pressable
                    style={styles.inlineRetryButton}
                    onPress={() => loadReactions(nextCursor, true)}
                  >
                    <AppText variant="caption" color={COLORS.primary}>
                      Thử lại
                    </AppText>
                  </Pressable>
                </View>
              ) : null}
              {loadingMore ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator color={COLORS.primary} />
                </View>
              ) : null}
            </>
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  emptyList: {
    flexGrow: 1,
  },
  userRow: {
    minHeight: 68,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceAlt,
  },
  displayName: {
    flex: 1,
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  inlineError: {
    padding: SPACING.md,
    alignItems: "center",
  },
  inlineRetryButton: {
    marginTop: SPACING.sm,
  },
  footerLoading: {
    padding: SPACING.lg,
    alignItems: "center",
  },
});
