import { StyleSheet, View } from "react-native";

import PostCard from "@/components/PostCard";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import type { Post } from "@/types/post";

type Props = {
  posts: Post[];
  emptyMessage: string;
  onPostPress: (postId: string) => void;
  onPostDeleted: (postId: string) => void;
};

export default function ProfilePostList({
  posts,
  emptyMessage,
  onPostPress,
  onPostDeleted,
}: Props) {
  return (
    <>
      <View style={styles.header}>
        <AppText variant="subtitle">Bài viết</AppText>
        <AppText variant="caption" color={COLORS.textMuted}>
          {posts.length} bài viết
        </AppText>
      </View>

      {posts.length === 0 ? (
        <View style={styles.empty}>
          <AppText color={COLORS.textMuted}>{emptyMessage}</AppText>
        </View>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onPress={() => onPostPress(post.id)}
            onDeleted={onPostDeleted}
          />
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: "center",
  },
});
