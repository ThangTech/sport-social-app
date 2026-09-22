import AppText from "@/components/ui/AppText";
import { COLORS, RADIUS, SPACING } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

export default function UserNotFound() {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons
          name="person-remove-outline"
          size={58}
          color={COLORS.textMuted}
        />
      </View>

      <AppText variant="title" style={styles.title}>
        Không tìm thấy người dùng
      </AppText>

      <AppText color={COLORS.textMuted} style={styles.description}>
        Tài khoản này có thể không tồn tại, đã bị xóa hoặc hiện không thể truy
        cập.
      </AppText>

      <Pressable style={styles.primaryButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={COLORS.background} />

        <AppText style={styles.primaryText}>Quay lại</AppText>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.replace("/(tabs)")}
      >
        <Ionicons name="home-outline" size={20} color={COLORS.text} />

        <AppText style={styles.secondaryText}>Về trang chủ</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  iconBox: {
    width: 112,
    height: 112,
    borderRadius: 56,
    marginBottom: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  title: {
    textAlign: "center",
  },

  description: {
    marginTop: SPACING.md,
    maxWidth: 320,
    textAlign: "center",
    lineHeight: 22,
  },

  primaryButton: {
    width: "100%",
    maxWidth: 320,
    marginTop: SPACING.xl,
    paddingVertical: 13,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },

  primaryText: {
    color: COLORS.background,
    fontWeight: "600",
  },

  secondaryButton: {
    width: "100%",
    maxWidth: 320,
    marginTop: SPACING.md,
    paddingVertical: 13,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,

    borderWidth: 1,
    borderColor: COLORS.border,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },

  secondaryText: {
    color: COLORS.text,
    fontWeight: "600",
  },
});
