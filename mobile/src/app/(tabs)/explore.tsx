import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ApiPost = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: {
    likes: number;
    dislikes: number;
  };
  views: number;
  userId: number;
};

const LIMIT = 10;

export default function ExploreScreen() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState("");

  const fetchPosts = async (currentSkip: number, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `https://dummyjson.com/posts?limit=${LIMIT}&skip=${currentSkip}`,
      );

      if (!response.ok) {
        throw new Error("Không thể tải dữ liệu");
      }

      const data = await response.json();

      if (isLoadMore) {
        setPosts((currentPosts) => [...currentPosts, ...data.posts]);
      } else {
        setPosts(data.posts);
      }

      setTotal(data.total);
    } catch {
      setError("Đã xảy ra lỗi khi tải bài viết");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(0);
  }, []);

  const handleLoadMore = async () => {
    const nextSkip = skip + LIMIT;

    await fetchPosts(nextSkip, true);

    setSkip(nextSkip);
  };

  const hasMore = posts.length < total;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <AppText color={COLORS.textMuted}>Đang tải...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <AppText color={COLORS.textMuted}>{error}</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <AppText variant="title">Khám phá</AppText>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <AppText variant="subtitle">{item.title}</AppText>

            <AppText>{item.body}</AppText>

            <View style={styles.stats}>
              <AppText variant="caption" color={COLORS.textMuted}>
                ❤️ {item.reactions.likes}
              </AppText>

              <AppText variant="caption" color={COLORS.textMuted}>
                👁 {item.views}
              </AppText>
            </View>
          </View>
        )}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={COLORS.primary} />

              <AppText variant="caption" color={COLORS.textMuted}>
                Đang tải thêm...
              </AppText>
            </View>
          ) : !hasMore ? (
            <AppText style={styles.endText} color={COLORS.textMuted}>
              Đã tải hết bài viết
            </AppText>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    padding: SPACING.lg,
  },

  list: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },

  card: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    gap: SPACING.sm,
  },

  stats: {
    flexDirection: "row",
    gap: SPACING.lg,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },

  loadMoreButton: {
    marginTop: SPACING.md,
    paddingVertical: 12,

    backgroundColor: COLORS.primary,
    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",
  },

  loadMoreText: {
    color: COLORS.background,
    fontWeight: "600",
  },

  endText: {
    textAlign: "center",
    paddingVertical: SPACING.lg,
  },
});
