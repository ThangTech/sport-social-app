import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile, updateMyProfile } from "@/services/user.service";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfileScreen() {
  const { user, updateDisplayName } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setErrorMessage("Không tìm thấy thông tin tài khoản.");
        setLoading(false);
        return;
      }

      try {
        setErrorMessage("");
        const profile = await getUserProfile(user.id);

        setDisplayName(profile.displayName);
        setBio(profile.bio ?? "");
        setDateOfBirth(profile.dateOfBirth ?? "");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Không thể tải thông tin hồ sơ.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  const validateDateOfBirth = (value: string) => {
    if (!value) return true;

    const parts = value.split("-");

    if (parts.length !== 3) return false;

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      value.length === 10 &&
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  };

  const handleSave = async () => {
    const trimmedDisplayName = displayName.trim();
    const trimmedBio = bio.trim();
    const trimmedDateOfBirth = dateOfBirth.trim();

    if (submitting) return;

    if (trimmedDisplayName.length < 2 || trimmedDisplayName.length > 100) {
      setErrorMessage("Tên hiển thị phải có từ 2 đến 100 ký tự.");
      return;
    }

    if (trimmedBio.length > 500) {
      setErrorMessage("Giới thiệu không được vượt quá 500 ký tự.");
      return;
    }

    if (!validateDateOfBirth(trimmedDateOfBirth)) {
      setErrorMessage("Ngày sinh phải có định dạng YYYY-MM-DD.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      const profile = await updateMyProfile({
        displayName: trimmedDisplayName,
        bio: trimmedBio || null,
        dateOfBirth: trimmedDateOfBirth || null,
      });

      updateDisplayName(profile.displayName);
      router.back();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể cập nhật hồ sơ.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          disabled={submitting}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={27} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle" style={styles.headerTitle}>
          Chỉnh sửa hồ sơ
        </AppText>

        <Pressable
          style={[styles.saveButton, submitting && styles.disabledButton]}
          disabled={submitting || loading}
          onPress={handleSave}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <AppText style={styles.saveButtonText}>Lưu</AppText>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <AppText color={COLORS.textMuted} style={styles.message}>
            Đang tải hồ sơ...
          </AppText>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
          >
            {errorMessage ? (
              <View style={styles.errorBox}>
                <AppText color={COLORS.danger}>{errorMessage}</AppText>
              </View>
            ) : null}

            <View style={styles.field}>
              <AppText variant="label">Tên hiển thị</AppText>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                editable={!submitting}
                maxLength={100}
                placeholder="Tên hiển thị"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />
              <AppText variant="caption" color={COLORS.textMuted}>
                {displayName.length}/100
              </AppText>
            </View>

            <View style={styles.field}>
              <AppText variant="label">Giới thiệu</AppText>
              <TextInput
                value={bio}
                onChangeText={setBio}
                editable={!submitting}
                maxLength={500}
                multiline
                placeholder="Viết vài dòng về bạn"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, styles.bioInput]}
              />
              <AppText variant="caption" color={COLORS.textMuted}>
                {bio.length}/500
              </AppText>
            </View>

            <View style={styles.field}>
              <AppText variant="label">Ngày sinh</AppText>
              <TextInput
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                editable={!submitting}
                maxLength={10}
                keyboardType="numbers-and-punctuation"
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />
              <AppText variant="caption" color={COLORS.textMuted}>
                Ví dụ: 2000-12-31
              </AppText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
  headerTitle: {
    position: "absolute",
    left: 88,
    right: 88,
    textAlign: "center",
  },
  saveButton: {
    minWidth: 64,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.background,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  message: {
    marginTop: SPACING.md,
  },
  keyboardView: {
    flex: 1,
  },
  form: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  errorBox: {
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 10,
  },
  field: {
    gap: SPACING.sm,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 16,
  },
  bioInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
});
