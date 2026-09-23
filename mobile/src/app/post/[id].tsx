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
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CommentItem from "@/components/CommentItem";
import { createComment, getComments } from "@/services/comment.service";
import type { CommentDto } from "@/types/comment";
import { useRef } from "react";
export default function PostDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

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
    if (id) {
      loadComments(id);
    }
  }, [id]);
  const loadComments = async (postId: string) => {
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
  };
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
            />

            <View style={styles.commentsHeader}>
              <AppText variant="subtitle">Bình luận</AppText>

              <AppText variant="caption" color={COLORS.textMuted}>
                {post.commentCount} bình luận
              </AppText>
            </View>

            {commentsLoading ? (
              <View style={styles.commentsLoading}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : commentError && comments.length === 0 ? (
              <View style={styles.commentMessage}>
                <AppText color={COLORS.danger}>{commentError}</AppText>
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.commentMessage}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={42}
                  color={COLORS.textMuted}
                />

                <AppText color={COLORS.textMuted} style={styles.message}>
                  Chưa có bình luận nào.
                </AppText>

                <AppText variant="caption" color={COLORS.textMuted}>
                  Hãy là người đầu tiên bình luận.
                </AppText>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                    onAuthorPress={(userId) =>
                      router.push({
                        pathname: "/user/[id]",
                        params: {
                          id: userId,
                        },
                      })
                    }
                  />
                ))}
              </View>
            )}

            {commentError && comments.length > 0 ? (
              <View style={styles.inlineError}>
                <AppText variant="caption" color={COLORS.danger}>
                  {commentError}
                </AppText>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.commentComposer}>
            {replyingTo ? (
              <View style={styles.replyingBox}>
                <AppText variant="caption" color={COLORS.textMuted}>
                  Đang trả lời {replyingTo.authorName}
                </AppText>

                <Pressable onPress={() => setReplyingTo(null)}>
                  <Ionicons name="close" size={20} color={COLORS.textMuted} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <TextInput
                ref={commentInputRef}
                value={commentText}
                onChangeText={setCommentText}
                placeholder={
                  replyingTo
                    ? `Trả lời ${replyingTo.authorName}...`
                    : "Viết bình luận..."
                }
                placeholderTextColor={COLORS.textMuted}
                style={styles.commentInput}
                multiline
                maxLength={3000}
              />

              <Pressable
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || commentLoading}
                style={[
                  styles.sendButton,
                  (!commentText.trim() || commentLoading) &&
                    styles.sendButtonDisabled,
                ]}
              >
                {commentLoading ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <Ionicons name="send" size={20} color={COLORS.background} />
                )}
              </Pressable>
            </View>
          </View>
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

  commentsHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },

  commentsList: {
    padding: SPACING.lg,
  },

  commentsLoading: {
    padding: SPACING.xl,
    alignItems: "center",
  },

  commentMessage: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },

  inlineError: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },

  commentComposer: {
    backgroundColor: COLORS.surface,

    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,

    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  replyingBox: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.sm,
  },

  commentInput: {
    flex: 1,

    minHeight: 42,
    maxHeight: 110,

    paddingHorizontal: SPACING.md,
    paddingVertical: 10,

    borderRadius: 20,

    backgroundColor: COLORS.surfaceAlt,

    color: COLORS.text,

    fontSize: 15,
  },

  sendButton: {
    width: 42,
    height: 42,

    borderRadius: 21,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,
  },

  sendButtonDisabled: {
    opacity: 0.4,
  },
});
