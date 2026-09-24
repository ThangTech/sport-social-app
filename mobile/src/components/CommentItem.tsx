import Avatar from "@/components/Avatar";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import type { CommentDto } from "@/types/comment";
import { formatRelativeTime } from "@/utils/date";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useActionSheet } from "@expo/react-native-action-sheet";
type CommentItemProps = {
  comment: CommentDto;
  depth?: number;
  currentUserId?: string;

  onReply: (comment: CommentDto) => void;

  onUpdate: (commentId: string, content: string) => Promise<void>;

  onDelete: (commentId: string) => Promise<void>;

  onAuthorPress: (userId: string) => void;
};

export default function CommentItem({
  comment,
  depth = 0,
  currentUserId,
  onReply,
  onUpdate,
  onDelete,
  onAuthorPress,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);

  const [editText, setEditText] = useState(comment.content);

  const [loading, setLoading] = useState(false);
  const { showActionSheetWithOptions } = useActionSheet();
  const isOwner = currentUserId === comment.authorId;
  const handleSave = async () => {
    const content = editText.trim();

    if (!content || loading) return;

    if (content === comment.content) {
      setEditing(false);
      return;
    }

    try {
      setLoading(true);

      await onUpdate(comment.id, content);

      setEditing(false);
    } catch (error) {
      Alert.alert(
        "Không thể chỉnh sửa",
        error instanceof Error ? error.message : "Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = () => {
    Alert.alert("Xóa bình luận", "Bạn có chắc muốn xóa bình luận này?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);

            await onDelete(comment.id);
          } catch (error) {
            Alert.alert(
              "Không thể xóa",
              error instanceof Error ? error.message : "Vui lòng thử lại.",
            );
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };
  const handleMenu = () => {
    const options = ["Chỉnh sửa", "Xóa", "Hủy"];

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 2,
        destructiveButtonIndex: 1,
        title: "Tùy chọn bình luận",
      },
      (selectedIndex) => {
        if (selectedIndex === 0) {
          setEditText(comment.content);
          setEditing(true);
        }

        if (selectedIndex === 1) {
          handleDelete();
        }
      },
    );
  };
  return (
    <View
      style={[
        styles.container,
        {
          marginLeft: Math.min(depth, 3) * 20,
        },
      ]}
    >
      <Pressable onPress={() => onAuthorPress(comment.authorId)}>
        <Avatar
          source={
            comment.authorAvatar
              ? {
                  uri: getFileUrl(comment.authorAvatar)!,
                }
              : require("@/assets/images/icon.png")
          }
        />
      </Pressable>

      <View style={styles.body}>
        <View style={styles.bubble}>
          <View style={styles.commentHeader}>
            <Pressable onPress={() => onAuthorPress(comment.authorId)}>
              <AppText variant="label">{comment.authorName}</AppText>
            </Pressable>

            {isOwner && !comment.isDeleted ? (
              <Pressable hitSlop={10} disabled={loading} onPress={handleMenu}>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={18}
                  color={COLORS.textMuted}
                />
              </Pressable>
            ) : null}
          </View>

          {editing ? (
            <View style={styles.editBox}>
              <TextInput
                value={editText}
                onChangeText={setEditText}
                multiline
                maxLength={3000}
                autoFocus
                style={styles.editInput}
                placeholderTextColor={COLORS.textMuted}
              />

              <View style={styles.editActions}>
                <Pressable
                  disabled={loading}
                  onPress={() => {
                    setEditText(comment.content);
                    setEditing(false);
                  }}
                >
                  <AppText variant="caption" color={COLORS.textMuted}>
                    Hủy
                  </AppText>
                </Pressable>

                <Pressable
                  disabled={loading || !editText.trim()}
                  onPress={handleSave}
                >
                  <AppText
                    variant="caption"
                    color={COLORS.primary}
                    style={styles.saveText}
                  >
                    {loading ? "Đang lưu..." : "Lưu"}
                  </AppText>
                </Pressable>
              </View>
            </View>
          ) : (
            <AppText color={comment.isDeleted ? COLORS.textMuted : COLORS.text}>
              {comment.content}
            </AppText>
          )}
        </View>
        <View style={styles.actions}>
          <AppText variant="caption" color={COLORS.textMuted}>
            {formatRelativeTime(comment.createdAt)}
          </AppText>

          {!comment.isDeleted ? (
            <Pressable onPress={() => onReply(comment)}>
              <AppText
                variant="caption"
                color={COLORS.textMuted}
                style={styles.replyText}
              >
                Trả lời
              </AppText>
            </Pressable>
          ) : null}

          {comment.updatedAt && !comment.isDeleted ? (
            <AppText variant="caption" color={COLORS.textMuted}>
              Đã chỉnh sửa
            </AppText>
          ) : null}
        </View>

        {comment.replies.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            depth={depth + 1}
            currentUserId={currentUserId}
            onReply={onReply}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAuthorPress={onAuthorPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },

  body: {
    flex: 1,
  },

  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,

    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,

    gap: 4,
  },

  actions: {
    marginTop: 5,
    paddingHorizontal: SPACING.sm,

    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },

  replyText: {
    fontWeight: "600",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },

  editBox: {
    marginTop: SPACING.xs,
  },

  editInput: {
    minHeight: 40,
    maxHeight: 120,

    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,

    borderRadius: 10,

    backgroundColor: COLORS.surface,

    color: COLORS.text,
    fontSize: 15,
  },

  editActions: {
    marginTop: SPACING.sm,

    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",

    gap: SPACING.lg,
  },

  saveText: {
    fontWeight: "600",
  },
});
