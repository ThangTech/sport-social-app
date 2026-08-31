import { COLORS, SPACING } from "@/constants/theme";
import { Image, StyleSheet, View, Alert, Pressable } from "react-native";
import AppText from "./ui/AppText";
import Avatar from "./Avatar";
import SportBadge from "./SportBadge";
import { Post } from "../types/post";
import Ionicons from "@expo/vector-icons/Ionicons";

type PostCardProps = {
  post: Post;
  onPress?: () => void;
};
export default function PostCard({ post, onPress }: PostCardProps) {
  return (
    <View style={styles.card}>
      <Pressable onPress={onPress}>
        <View style={styles.header}>
          <Avatar source={post.authorAvatar} />

          <View style={styles.author}>
            <AppText variant="label"> {post.authorName}</AppText>

            <AppText variant="caption" color={COLORS.textMuted}>
              {post.createdAt}
            </AppText>
          </View>

          <SportBadge name={post.sport} />
        </View>

        <View style={styles.content}>
          <AppText>{post.content}</AppText>
        </View>
        <View style={styles.imageContainer}>
          <Image
            source={post.image}
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => Alert.alert("Thích bài viết")}
        >
          <Ionicons name="heart-outline" size={23} color={COLORS.textMuted} />

          <AppText variant="caption" color={COLORS.textMuted}>
            {post.likeCount}
          </AppText>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => Alert.alert("Bình luận")}
        >
          <Ionicons
            name="chatbubble-outline"
            size={22}
            color={COLORS.textMuted}
          />

          <AppText variant="caption" color={COLORS.textMuted}>
            {post.commentCount}
          </AppText>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => Alert.alert("Chia sẻ")}
        >
          <Ionicons
            name="share-social-outline"
            size={22}
            color={COLORS.textMuted}
          />
        </Pressable>

        <Pressable
          style={styles.saveButton}
          onPress={() => Alert.alert("Lưu bài viết")}
        >
          <Ionicons
            name="bookmark-outline"
            size={23}
            color={COLORS.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },

  header: {
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },

  author: {
    flex: 1,
  },

  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  imageContainer: {
    width: "100%",
    height: 280,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  actions: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },

  saveButton: {
    marginLeft: "auto",
  },
});
