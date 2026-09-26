import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountSettingsScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>

        <AppText variant="subtitle">Tài khoản</AppText>
        <View style={styles.headerSpace} />
      </View>

      <View style={styles.content}>
        <Pressable
          style={styles.menuItem}
          onPress={() => router.push("/post/saved-posts")}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons
                name="bookmark-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>
            <AppText variant="label">Bài viết đã lưu</AppText>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textMuted}
          />
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <AppText variant="label" color={COLORS.danger}>
            Đăng xuất
          </AppText>
        </Pressable>
      </View>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpace: {
    width: 40,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  menuItem: {
    minHeight: 64,
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  menuIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: COLORS.surfaceAlt,
  },
  logoutButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 12,
  },
});
