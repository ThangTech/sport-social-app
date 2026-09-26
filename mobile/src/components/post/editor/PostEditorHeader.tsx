import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

type Props = {
  title: string;
  onClose: () => void;
  closeIcon?: "close" | "arrow-back";
  submitLabel?: string;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  submitting?: boolean;
  variant?: "create" | "edit";
};

export default function PostEditorHeader({
  title,
  onClose,
  closeIcon = "close",
  submitLabel,
  onSubmit,
  submitDisabled = false,
  submitting = false,
  variant = "edit",
}: Props) {
  return (
    <View style={styles.header}>
      <Pressable
        style={styles.headerButton}
        onPress={onClose}
        disabled={submitting}
      >
        <Ionicons
          name={closeIcon}
          size={closeIcon === "arrow-back" ? 24 : variant === "create" ? 28 : 27}
          color={COLORS.text}
        />
      </Pressable>

      <AppText variant="subtitle">{title}</AppText>

      {submitLabel && onSubmit ? (
        <Pressable
          style={[
            styles.submitButton,
            variant === "create"
              ? styles.createSubmitButton
              : styles.editSubmitButton,
            submitDisabled && styles.submitButtonDisabled,
          ]}
          onPress={onSubmit}
          disabled={submitDisabled}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <AppText style={styles.submitButtonText}>{submitLabel}</AppText>
          )}
        </Pressable>
      ) : (
        <View style={styles.headerSpace} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpace: {
    width: 40,
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  createSubmitButton: {
    minWidth: 68,
  },
  editSubmitButton: {
    minWidth: 64,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: COLORS.background,
    fontWeight: "600",
  },
});
