import { forwardRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import type { CommentDto } from "@/types/comment";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  replyingTo: CommentDto | null;
  onCancelReply: () => void;
  onSubmit: () => void;
  loading: boolean;
};

const CommentComposer = forwardRef<TextInput, Props>(function CommentComposer(
  props,
  ref,
) {
  const disabled = !props.value.trim() || props.loading;

  return (
    <View style={styles.composer}>
      {props.replyingTo ? (
        <View style={styles.replyingBox}>
          <AppText variant="caption" color={COLORS.textMuted}>
            Đang trả lời {props.replyingTo.authorName}
          </AppText>
          <Pressable onPress={props.onCancelReply}>
            <Ionicons name="close" size={20} color={COLORS.textMuted} />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <TextInput
          ref={ref}
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={
            props.replyingTo
              ? `Trả lời ${props.replyingTo.authorName}...`
              : "Viết bình luận..."
          }
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
          multiline
          maxLength={3000}
        />
        <Pressable
          onPress={props.onSubmit}
          disabled={disabled}
          style={[styles.sendButton, disabled && styles.sendButtonDisabled]}
        >
          {props.loading ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <Ionicons name="send" size={20} color={COLORS.background} />
          )}
        </Pressable>
      </View>
    </View>
  );
});
export default CommentComposer;

const styles = StyleSheet.create({
  composer: {
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
  input: {
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
