import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ImageSourcePropType } from "react-native";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

type Props = {
  title: string;
  note: string;
  imageSource: ImageSourcePropType | null;
  variant: "avatar" | "cover";
  hasCurrentImage: boolean;
  hasSelectedImage: boolean;
  loading: boolean;
  disabled: boolean;
  onPick: () => void;
  onCancelSelection: () => void;
  onUpload: () => void;
  onDelete: () => void;
};

export default function ProfileImageField({
  title,
  note,
  imageSource,
  variant,
  hasCurrentImage,
  hasSelectedImage,
  loading,
  disabled,
  onPick,
  onCancelSelection,
  onUpload,
  onDelete,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" color={COLORS.textMuted}>
          {note}
        </AppText>
      </View>

      {imageSource ? (
        <Image
          source={imageSource}
          style={variant === "avatar" ? styles.avatar : styles.cover}
        />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Ionicons name="image-outline" size={34} color={COLORS.textMuted} />
          <AppText variant="caption" color={COLORS.textMuted}>
            Chưa có ảnh bìa
          </AppText>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          style={styles.secondaryButton}
          disabled={disabled}
          onPress={onPick}
        >
          <Ionicons name="image-outline" size={18} color={COLORS.primary} />
          <AppText variant="label" color={COLORS.primary}>
            Chọn ảnh
          </AppText>
        </Pressable>

        {hasSelectedImage ? (
          <>
            <Pressable
              style={styles.textButton}
              disabled={disabled}
              onPress={onCancelSelection}
            >
              <AppText color={COLORS.textMuted}>Hủy</AppText>
            </Pressable>
            <Pressable
              style={styles.primaryButton}
              disabled={disabled}
              onPress={onUpload}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <AppText variant="label" color={COLORS.background}>
                  Tải lên
                </AppText>
              )}
            </Pressable>
          </>
        ) : hasCurrentImage ? (
          <Pressable
            style={styles.deleteButton}
            disabled={disabled}
            onPress={onDelete}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.danger} />
            ) : (
              <AppText variant="label" color={COLORS.danger}>
                Xóa
              </AppText>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: SPACING.md,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    alignSelf: "center",
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: COLORS.surfaceAlt,
  },
  cover: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  actions: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: SPACING.sm,
  },
  secondaryButton: {
    marginRight: "auto",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
  },
  textButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  primaryButton: {
    minWidth: 76,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    minWidth: 58,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 20,
  },
});
