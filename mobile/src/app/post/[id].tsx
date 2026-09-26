import PostCard from "@/components/PostCard";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getPostById } from "@/services/post.service";
import type { Post } from "@/types/post";
import { mapFeedPostToPost } from "@/mappers/post.mapper";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PostCommentsSection from "@/components/post/PostCommentsSection";
import CommentComposer from "@/components/post/CommentComposer";
import {
  createComment,
  getComments,
  deleteComment,
  updateComment,
} from "@/services/comment.service";
import type { CommentDto } from "@/types/comment";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
export default function PostDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const { user: currentUser } = useAuth();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [comments, setComments] = useState<CommentDto[]>([]);

  const [commentText, setCommentText] = useState("");

  const [commentLoading, setCommentLoading] = useState(false);

  const [commentsLoading, setCommentsLoading] = useState(true);

  const [commentError, setCommentError] = useState("");

  const [replyingTo, setReplyingTo] = useState<CommentDto | null>(null);

  const commentInputRef = useRef<TextInput>(null);
  const loadPost = useCallback(async (postId: string) => {
    try {
      setErrorMessage("");

      const item = await getPostById(postId);

      setPost(mapFeedPostToPost(item));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể tải bài viết.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  const loadComments = useCallback(async (postId: string) => {
    try {
      setCommentError("");

      const result = await getComments(postId);

      setComments(result);
    } catch (error) {
      setCommentError(
        error instanceof Error ? error.message : "Không thể tải bình luận.",
      );
    } finally {
      setCommentsLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setErrorMessage("Không tìm thấy bài viết.");

        setLoading(false);
        return;
      }

      loadPost(id);
      loadComments(id);
    }, [id, loadPost, loadComments]),
  );
  const handleReply = (comment: CommentDto) => {
    setReplyingTo(comment);

    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };
  const handleSubmitComment = async () => {
    const content = commentText.trim();

    if (!id || !content || commentLoading) {
      return;
    }

    try {
      setCommentLoading(true);
      setCommentError("");

      await createComment(id, {
        content,
        parentCommentId: replyingTo?.id ?? null,
      });

      setCommentText("");
      setReplyingTo(null);

      await loadComments(id);

      setPost((current) =>
        current
          ? {
              ...current,
              commentCount: current.commentCount + 1,
            }
          : current,
      );
    } catch (error) {
      setCommentError(
        error instanceof Error ? error.message : "Không thể gửi bình luận.",
      );
    } finally {
      setCommentLoading(false);
    }
  };
  const handleUpdateComment = async (commentId: string, content: string) => {
    if (!id) return;

    await updateComment(commentId, content);

    await loadComments(id);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;

    await deleteComment(commentId);

    await loadComments(id);

    setPost((current) =>
      current
        ? {
            ...current,
            commentCount: Math.max(0, current.commentCount - 1),
          }
        : current,
    );
  };
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
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
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
              onCommentPress={() => commentInputRef.current?.focus()}
              onDeleted={() => {
                router.replace({
                  pathname: "/(tabs)",
                  params: {
                    refresh: Date.now().toString(),
                  },
                });
              }}
            />

            <PostCommentsSection
              comments={comments}
              count={post.commentCount}
              loading={commentsLoading}
              error={commentError}
              currentUserId={currentUser?.id}
              onReply={handleReply}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
              onAuthorPress={(userId) =>
                router.push({
                  pathname: "/user/[id]",
                  params: { id: userId },
                })
              }
            />
          </ScrollView>

          <CommentComposer
            ref={commentInputRef}
            value={commentText}
            onChangeText={setCommentText}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onSubmit={handleSubmitComment}
            loading={commentLoading}
          />
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: SPACING.lg,
  },

});
