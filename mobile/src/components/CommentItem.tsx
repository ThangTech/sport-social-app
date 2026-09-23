import Avatar from "@/components/Avatar";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import type { CommentDto } from "@/types/comment";
import { formatRelativeTime } from "@/utils/date";
import { Pressable, StyleSheet, View } from "react-native";

type CommentItemProps = {
  comment: CommentDto;
  depth?: number;
  onReply: (comment: CommentDto) => void;
  onAuthorPress: (userId: string) => void;
};

export default function CommentItem({
  comment,
  depth = 0,
  onReply,
  onAuthorPress,
}: CommentItemProps) {
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
          <Pressable onPress={() => onAuthorPress(comment.authorId)}>
            <AppText variant="label">{comment.authorName}</AppText>
          </Pressable>

          <AppText color={comment.isDeleted ? COLORS.textMuted : COLORS.text}>
            {comment.content}
          </AppText>
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
        </View>

        {comment.replies.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            depth={depth + 1}
            onReply={onReply}
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
});
