import AppHeader from "@/components/AppHeader";
import CreatePostPrompt from "@/components/CreatePostPrompt";
import PostCard from "@/components/PostCard";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import { getFeed } from "@/services/feed.service";
import type { Post } from "@/types/post";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatRelativeTime } from "@/utils/date";
export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadFeed = async () => {
    try {
      setErrorMessage("");

      const response = await getFeed(20);

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
          };
        }),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể tải bảng tin.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
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
        keyExtractor={(item) => item.id}
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
