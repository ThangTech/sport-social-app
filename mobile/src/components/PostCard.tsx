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
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { router } from "expo-router";
import PostCardHeader from "@/components/post/PostCardHeader";
import PostCardActions from "@/components/post/PostCardActions";
import { getFileUrl } from "@/services/api";
type PostCardProps = {
  post: Post;
  onPress?: () => void;
  onAuthorPress?: () => void;
  onCommentPress?: () => void;
  onSavedChange?: (saved: boolean) => void;
  onDeleted?: (postId: string) => void;
  onRemoveFromGroup?: (postId: string) => Promise<void>;
};
export default function PostCard({
  post,
  onPress,
  onAuthorPress,
  onCommentPress,
  onSavedChange,
  onDeleted,
  onRemoveFromGroup,
}: PostCardProps) {
  const { user: currentUser, profileImageVersion } = useAuth();

  const { showActionSheetWithOptions } = useActionSheet();

  const isOwner = currentUser?.id === post.authorId;
  const displayedPost = isOwner
    ? {
        ...post,
        authorAvatar: currentUser.avatarUrl
          ? {
              uri: getFileUrl(currentUser.avatarUrl, profileImageVersion)!,
            }
          : require("@/assets/images/icon.png"),
      }
    : post;
  const [reactionCount, setReactionCount] = useState(post.likeCount);

  const [currentReaction, setCurrentReaction] = useState<number | null>(
    post.currentReaction ?? null,
  );

  const [reactionLoading, setReactionLoading] = useState(false);
  const [saved, setSaved] = useState(post.isSaved);
  const [saveLoading, setSaveLoading] = useState(false);
  const [menuActionLoading, setMenuActionLoading] = useState(false);
  const menuActionLoadingRef = useRef(false);
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
  const handleReactionCountPress = () => {
    router.push({
      pathname: "/post/reactions/[id]",
      params: {
        id: post.id,
      },
    });
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
  const handleRemoveFromGroup = () => {
    if (!onRemoveFromGroup || menuActionLoadingRef.current) return;

    Alert.alert(
      "Gỡ khỏi nhóm",
      "Bài viết sẽ không còn hiển thị và người dùng không thể mở bài từ nhóm.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Gỡ khỏi nhóm",
          style: "destructive",
          onPress: async () => {
            if (menuActionLoadingRef.current) return;

            try {
              menuActionLoadingRef.current = true;
              setMenuActionLoading(true);
              await onRemoveFromGroup(post.id);
            } catch (error) {
              Alert.alert(
                "Không thể gỡ bài viết",
                error instanceof Error ? error.message : "Vui lòng thử lại.",
              );
            } finally {
              menuActionLoadingRef.current = false;
              setMenuActionLoading(false);
            }
          },
        },
      ],
    );
  };
  const handlePostMenu = () => {
    const actions: ("edit" | "delete" | "remove" | "report")[] = [];
    const options: string[] = [];

    if (isOwner) {
      actions.push("edit", "delete");
      options.push("Chỉnh sửa", "Xóa bài viết");
    }

    if (onRemoveFromGroup) {
      actions.push("remove");
      options.push("Gỡ khỏi nhóm");
    }

    if (!isOwner) {
      actions.push("report");
      options.push("Báo cáo bài viết");
    }

    options.push("Hủy");
    const cancelButtonIndex = options.length - 1;
    const destructiveButtonIndex = actions
      .map((action, index) => (action === "edit" ? -1 : index))
      .filter((index) => index >= 0);

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title: "Tùy chọn bài viết",
      },
      (index) => {
        if (index === undefined || index === cancelButtonIndex) return;

        const action = actions[index];

        if (action === "edit") {
          router.push({
            pathname: "../../post/edit/[id]",
            params: {
              id: post.id,
            },
          });
        }

        if (action === "delete") handleDeletePost();
        if (action === "remove") handleRemoveFromGroup();
        if (action === "report") router.push({ pathname: "/report" as never, params: { targetType: "2", targetId: post.id } });
      },
    );
  };
  const showMenu =
    !menuActionLoading && Boolean(currentUser);
  return (
    <View style={styles.card}>
      <PostCardHeader
        post={displayedPost}
        showMenu={showMenu}
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
        onReactionCountPress={handleReactionCountPress}
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
