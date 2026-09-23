import PostCard from "@/components/PostCard";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import { getPostById } from "@/services/post.service";
import type { Post } from "@/types/post";
import { formatRelativeTime } from "@/utils/date";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PostDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadPost = async () => {
      if (!id) {
        setErrorMessage("Không tìm thấy bài viết.");
        setLoading(false);
        return;
      }

      try {
        setErrorMessage("");

        const item = await getPostById(id);

        const firstImage = item.media.find((media) => media.mediaType === 1);

        setPost({
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
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Không thể tải bài viết.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Bài viết</AppText>

        <View style={styles.headerSpace} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang tải bài viết...
          </AppText>
        </View>
      ) : errorMessage ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={COLORS.textMuted}
          />

          <AppText color={COLORS.textMuted} style={styles.message}>
            {errorMessage}
          </AppText>
        </View>
      ) : post ? (
        <ScrollView>
          <PostCard
            post={post}
            onAuthorPress={() =>
              router.push({
                pathname: "/user/[id]",
                params: {
                  id: post.authorId,
                },
              })
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
});
