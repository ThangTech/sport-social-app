import { ActivityIndicator, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import CommentItem from "@/components/CommentItem";
import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import type { CommentDto } from "@/types/comment";

type Props = {
  comments: CommentDto[];
  count: number;
  loading: boolean;
  error: string;
  currentUserId?: string;
  onReply: (comment: CommentDto) => void;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAuthorPress: (id: string) => void;
};

export default function PostCommentsSection(props: Props) {
  return (
    <>
      <View style={styles.header}>
        <AppText variant="subtitle">Bình luận</AppText>
        <AppText variant="caption" color={COLORS.textMuted}>
          {props.count} bình luận
        </AppText>
      </View>
      {props.loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : props.error && props.comments.length === 0 ? (
        <View style={styles.message}>
          <AppText color={COLORS.danger}>{props.error}</AppText>
        </View>
      ) : props.comments.length === 0 ? (
        <View style={styles.message}>
          <Ionicons name="chatbubbles-outline" size={42} color={COLORS.textMuted} />
          <AppText color={COLORS.textMuted} style={styles.messageText}>
            Chưa có bình luận nào.
          </AppText>
          <AppText variant="caption" color={COLORS.textMuted}>
            Hãy là người đầu tiên bình luận.
          </AppText>
        </View>
      ) : (
        <View style={styles.list}>
          {props.comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={props.currentUserId}
              onReply={props.onReply}
              onUpdate={props.onUpdate}
              onDelete={props.onDelete}
              onAuthorPress={props.onAuthorPress}
            />
          ))}
        </View>
      )}
      {props.error && props.comments.length > 0 ? (
        <View style={styles.inlineError}>
          <AppText variant="caption" color={COLORS.danger}>
            {props.error}
          </AppText>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  list: {
    padding: SPACING.lg,
  },
  loading: {
    padding: SPACING.xl,
    alignItems: "center",
  },
  message: {
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: {
    marginTop: SPACING.md,
    textAlign: "center",
  },
  inlineError: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
});
