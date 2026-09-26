import type { ReactNode } from "react";
import { Image, StyleSheet, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { getFileUrl } from "@/services/api";
import PostAudienceSelector from "@/components/post/editor/PostAudienceSelector";

type Props = {
  content: string;
  onContentChange: (content: string) => void;
  visibility: number;
  onVisibilityChange: (visibility: number) => void;
  displayName?: string | null;
  avatarUrl?: string | null;
  disabled?: boolean;
  placeholder: string;
  variant: "create" | "edit";
  children?: ReactNode;
};

export default function PostEditorForm({
  content,
  onContentChange,
  visibility,
  onVisibilityChange,
  displayName,
  avatarUrl,
  disabled = false,
  placeholder,
  variant,
  children,
}: Props) {
  return (
    <>
      <View style={styles.userSection}>
        {variant === "create" ? (
          <Image
            source={
              avatarUrl
                ? { uri: getFileUrl(avatarUrl)! }
                : require("@/assets/images/icon.png")
            }
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color={COLORS.textMuted} />
          </View>
        )}

        <View style={variant === "create" ? styles.userInfo : undefined}>
          <AppText variant="subtitle">{displayName || "Người dùng"}</AppText>

          <PostAudienceSelector
            value={visibility}
            onChange={onVisibilityChange}
            disabled={disabled}
          />

          {children}
        </View>
      </View>

      <TextInput
        value={content}
        onChangeText={onContentChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline
        autoFocus
        maxLength={5000}
        editable={!disabled}
        style={[styles.input, variant === "create" ? styles.createInput : styles.editInput]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  userInfo: {
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceAlt,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    paddingHorizontal: SPACING.lg,
    fontSize: 18,
    lineHeight: 25,
    color: COLORS.text,
    textAlignVertical: "top",
  },
  createInput: {
    minHeight: 180,
    paddingTop: SPACING.sm,
  },
  editInput: {
    minHeight: 220,
    paddingTop: SPACING.md,
  },
});
