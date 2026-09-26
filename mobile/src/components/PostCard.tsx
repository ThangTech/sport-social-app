import { COLORS, SPACING } from "@/constants/theme";
import { Image, StyleSheet, View, Alert, Pressable } from "react-native";
import AppText from "./ui/AppText";
import { Post } from "../types/post";
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
import PostCardHeader from "@/components/post/PostCardHeader";
import PostCardActions from "@/components/post/PostCardActions";
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
      <PostCardHeader
        post={post}
        isOwner={isOwner}
        onAuthorPress={onAuthorPress}
        onMenuPress={handlePostMenu}
      />
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
      <PostCardActions
        reactionCount={reactionCount}
        currentReaction={currentReaction}
        reactionLoading={reactionLoading}
        saved={saved}
        saveLoading={saveLoading}
        commentCount={post.commentCount}
        onReaction={handleReaction}
        onComment={onCommentPress ?? onPress}
        onSave={handleSave}
      />
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
});
