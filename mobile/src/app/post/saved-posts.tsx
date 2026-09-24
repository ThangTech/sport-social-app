import PostCard from "@/components/PostCard";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import { getSavedPosts } from "@/services/post.service";
import type { Post } from "@/types/post";
import { formatRelativeTime } from "@/utils/date";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SavedPostsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadSavedPosts = async () => {
    try {
      setErrorMessage("");

      const response = await getSavedPosts();

      setPosts(
        response.map((item) => {
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

            isSaved: true,
          };
        }),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải bài viết đã lưu.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSavedPosts();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Bài viết đã lưu</AppText>

        <View style={styles.headerSpace} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang tải bài viết đã lưu...
          </AppText>
        </View>
      ) : errorMessage ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={44}
            color={COLORS.textMuted}
          />

          <AppText color={COLORS.textMuted} style={styles.message}>
            {errorMessage}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            posts.length === 0 ? styles.emptyList : undefined
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name="bookmark-outline"
                size={52}
                color={COLORS.textMuted}
              />

              <AppText variant="subtitle" style={styles.emptyTitle}>
                Chưa có bài viết đã lưu
              </AppText>

              <AppText color={COLORS.textMuted} style={styles.message}>
                Những bài viết bạn lưu sẽ xuất hiện ở đây.
              </AppText>
            </View>
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
              onSavedChange={(saved) => {
                if (!saved) {
                  setPosts((current) =>
                    current.filter((post) => post.id !== item.id),
                  );
                }
              }}
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
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyList: {
    flexGrow: 1,
  },

  emptyTitle: {
    marginTop: SPACING.md,
  },

  message: {
    marginTop: SPACING.sm,
    textAlign: "center",
  },
});
