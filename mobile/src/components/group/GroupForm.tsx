import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import { GroupPrivacy, type SaveGroupRequest } from "@/types/group";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

type GroupFormProps = {
  initialName?: string;
  initialDescription?: string | null;
  initialPrivacy?: GroupPrivacy;
  submitLabel: string;
  onSubmit: (request: SaveGroupRequest) => Promise<void>;
};

export default function GroupForm({
  initialName = "",
  initialDescription = "",
  initialPrivacy = GroupPrivacy.Public,
  submitLabel,
  onSubmit,
}: GroupFormProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [privacy, setPrivacy] = useState(initialPrivacy);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async () => {
    if (submittingRef.current) return;

    const normalizedName = name.trim();
    const normalizedDescription = description.trim();

    if (normalizedName.length < 3 || normalizedName.length > 100) {
      setErrorMessage("Tên nhóm phải từ 3 đến 100 ký tự.");
      return;
    }

    if (normalizedDescription.length > 1000) {
      setErrorMessage("Mô tả nhóm không được vượt quá 1000 ký tự.");
      return;
    }

    try {
      submittingRef.current = true;
      setSubmitting(true);
      setErrorMessage("");

      await onSubmit({
        name: normalizedName,
        description: normalizedDescription || null,
        privacy,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể lưu nhóm.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <AppText variant="label">Tên nhóm</AppText>
        <TextInput
          value={name}
          onChangeText={setName}
          editable={!submitting}
          maxLength={100}
          placeholder="Ví dụ: Cộng đồng chạy bộ"
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
        />
        <AppText variant="caption" color={COLORS.textMuted}>
          {name.length}/100
        </AppText>
      </View>

      <View style={styles.field}>
        <AppText variant="label">Mô tả</AppText>
        <TextInput
          value={description}
          onChangeText={setDescription}
          editable={!submitting}
          maxLength={1000}
          multiline
          numberOfLines={5}
          placeholder="Giới thiệu ngắn về nhóm"
          placeholderTextColor={COLORS.textMuted}
          style={[styles.input, styles.descriptionInput]}
          textAlignVertical="top"
        />
        <AppText variant="caption" color={COLORS.textMuted}>
          {description.length}/1000
        </AppText>
      </View>

      <View style={styles.field}>
        <AppText variant="label">Quyền riêng tư</AppText>

        <View style={styles.privacyOptions}>
          <Pressable
            disabled={submitting}
            onPress={() => setPrivacy(GroupPrivacy.Public)}
            style={[
              styles.privacyOption,
              privacy === GroupPrivacy.Public && styles.selectedOption,
            ]}
          >
            <Ionicons
              name="globe-outline"
              size={22}
              color={
                privacy === GroupPrivacy.Public
                  ? COLORS.primary
                  : COLORS.textMuted
              }
            />
            <View style={styles.privacyText}>
              <AppText variant="label">Công khai</AppText>
              <AppText variant="caption" color={COLORS.textMuted}>
                Mọi người có thể xem và tham gia ngay.
              </AppText>
            </View>
          </Pressable>

          <Pressable
            disabled={submitting}
            onPress={() => setPrivacy(GroupPrivacy.Private)}
            style={[
              styles.privacyOption,
              privacy === GroupPrivacy.Private && styles.selectedOption,
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color={
                privacy === GroupPrivacy.Private
                  ? COLORS.primary
                  : COLORS.textMuted
              }
            />
            <View style={styles.privacyText}>
              <AppText variant="label">Riêng tư</AppText>
              <AppText variant="caption" color={COLORS.textMuted}>
                Yêu cầu tham gia cần được Owner hoặc Admin duyệt.
              </AppText>
            </View>
          </Pressable>
        </View>
      </View>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <AppText color={COLORS.danger}>{errorMessage}</AppText>
        </View>
      ) : null}

      <Pressable
        disabled={submitting}
        onPress={handleSubmit}
        style={[styles.submitButton, submitting && styles.disabledButton]}
      >
        {submitting ? (
          <ActivityIndicator color={COLORS.background} />
        ) : (
          <AppText variant="label" color={COLORS.background}>
            {submitLabel}
          </AppText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xl,
  },
  field: {
    gap: SPACING.sm,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: SPACING.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  descriptionInput: {
    minHeight: 120,
    paddingTop: SPACING.md,
  },
  privacyOptions: {
    gap: SPACING.sm,
  },
  privacyOption: {
    minHeight: 72,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  privacyText: {
    flex: 1,
    gap: SPACING.xs,
  },
  errorBox: {
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  submitButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
