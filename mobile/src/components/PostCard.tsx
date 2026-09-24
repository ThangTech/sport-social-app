import { COLORS, SPACING } from "@/constants/theme";
import { Image, StyleSheet, View, Alert, Pressable } from "react-native";
import AppText from "./ui/AppText";
import Avatar from "./Avatar";
import SportBadge from "./SportBadge";
import { Post } from "../types/post";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  reactPost,
  removePostReaction,
  savePost,
  unsavePost,
  deletePost,
} from "@/services/post.service";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { router } from "expo-router";
type PostCardProps = {
  post: Post;
  onPress?: () => void;
  onAuthorPress?: () => void;
  onCommentPress?: () => void;
  onSavedChange?: (saved: boolean) => void;
  onDeleted?: (postId: string) => void;
};
export default function PostCard({
  post,
  onPress,
  onAuthorPress,
  onCommentPress,
  onSavedChange,
  onDeleted,
}: PostCardProps) {
  const { user: currentUser } = useAuth();

  const { showActionSheetWithOptions } = useActionSheet();

  const isOwner = currentUser?.id === post.authorId;
  const [reactionCount, setReactionCount] = useState(post.likeCount);

  const [currentReaction, setCurrentReaction] = useState<number | null>(
    post.currentReaction ?? null,
  );

  const [reactionLoading, setReactionLoading] = useState(false);
  const [saved, setSaved] = useState(post.isSaved);
  const [saveLoading, setSaveLoading] = useState(false);
  useEffect(() => {
    setReactionCount(post.likeCount);
    setCurrentReaction(post.currentReaction ?? null);
    setSaved(post.isSaved);
  }, [post.id, post.likeCount, post.currentReaction, post.isSaved]);
  const handleReaction = async () => {
    if (reactionLoading) return;

    try {
      setReactionLoading(true);

      const response =
        currentReaction === 1
          ? await removePostReaction(post.id)
          : await reactPost(post.id, 1);

      setReactionCount(response.reactionCount);

      setCurrentReaction(response.currentReaction ?? null);
    } catch (error) {
      Alert.alert(
        "Không thể cập nhật",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setReactionLoading(false);
    }
  };
  const handleSave = async () => {
    if (saveLoading) return;

    try {
      setSaveLoading(true);

      if (saved) {
        await unsavePost(post.id);

        setSaved(false);
        onSavedChange?.(false);
      } else {
        await savePost(post.id);

        setSaved(true);
        onSavedChange?.(true);
      }
    } catch (error) {
      Alert.alert(
        "Không thể cập nhật",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setSaveLoading(false);
    }
  };
  const handleDeletePost = () => {
    Alert.alert("Xóa bài viết", "Bạn có chắc muốn xóa bài viết này?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePost(post.id);

            onDeleted?.(post.id);
          } catch (error) {
            Alert.alert(
              "Không thể xóa bài viết",
              error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
          }
        },
      },
    ]);
  };
  const handlePostMenu = () => {
    showActionSheetWithOptions(
      {
        options: ["Chỉnh sửa", "Xóa bài viết", "Hủy"],
        cancelButtonIndex: 2,
        destructiveButtonIndex: 1,
        title: "Tùy chọn bài viết",
      },
      (index) => {
        if (index === 0) {
          router.push({
            pathname: "../../post/edit/[id]",
            params: {
              id: post.id,
            },
          });
        }

        if (index === 1) {
          handleDeletePost();
        }
      },
    );
  };
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          style={styles.userInfo}
          disabled={!onAuthorPress}
          onPress={onAuthorPress}
        >
          <Avatar source={post.authorAvatar} />
          <View style={styles.author}>
            <AppText variant="label"> {post.authorName}</AppText>
            {post.groupName && (
              <AppText
                variant="caption"
                color={COLORS.primary}
                style={{ marginLeft: 2, marginTop: 5 }}
              >
                {post.groupName}
              </AppText>
            )}
            <AppText
              variant="caption"
              color={COLORS.textMuted}
              style={{ marginLeft: 2, marginTop: 5 }}
            >
              {post.createdAt}
            </AppText>
          </View>
        </Pressable>
        <View style={styles.headerActions}>
          {post.sport ? <SportBadge name={post.sport} /> : null}

          {isOwner ? (
            <Pressable hitSlop={10} onPress={handlePostMenu}>
              <Ionicons
                name="ellipsis-horizontal"
                size={22}
                color={COLORS.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
      <Pressable onPress={onPress}>
        <View style={styles.content}>
          <AppText>{post.content}</AppText>
        </View>
        {post.image ? (
          <View style={styles.imageContainer}>
            <Image
              source={post.image}
              style={styles.postImage}
              resizeMode="cover"
            />
          </View>
        ) : null}
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          style={[
            styles.actionButton,
            reactionLoading && styles.disabledAction,
          ]}
          disabled={reactionLoading}
          onPress={handleReaction}
        >
          <Ionicons
            name={currentReaction ? "heart" : "heart-outline"}
            size={23}
            color={currentReaction ? COLORS.danger : COLORS.textMuted}
          />

          <AppText
            variant="caption"
            color={currentReaction ? COLORS.danger : COLORS.textMuted}
          >
            {reactionCount}
          </AppText>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={onCommentPress ?? onPress}
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
          style={[styles.saveButton, saveLoading && styles.disabledAction]}
          disabled={saveLoading}
          onPress={handleSave}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={23}
            color={saved ? COLORS.primary : COLORS.textMuted}
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
  userInfo: {
    flex: 1,
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
  disabledAction: {
    opacity: 0.6,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
});
