import { useTheme } from "@/contexts/ThemeContext";
import AppText from "@/components/ui/AppText";
import { SPACING } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountSettingsScreen() {
  const { colors: COLORS, isLight, toggleTheme } = useTheme();
  const styles = createStyles(COLORS);
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
          onPress={() => router.push("/user/post-reviews")}
        >
          <AppText variant="label">Trạng thái bài viết của tôi</AppText>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </Pressable>
        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Ionicons
              name={isLight ? "sunny-outline" : "moon-outline"}
              size={22}
              color={COLORS.primary}
            />
            <AppText variant="label">Chế độ sáng</AppText>
          </View>
          <Switch
            value={isLight}
            onValueChange={toggleTheme}
            accessibilityLabel="Chế độ sáng"
          />
        </View>
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

          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() => router.push("/user/blocked-users")}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name="ban-outline" size={22} color={COLORS.primary} />
            </View>
            <AppText variant="label">Tài khoản đã chặn</AppText>
          </View>

          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() => router.push("/user/reports")}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons name="flag-outline" size={22} color={COLORS.primary} />
            </View>
            <AppText variant="label">Báo cáo của tôi</AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() => router.push("/user/copyright")}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>
            <AppText variant="label">Bản quyền của tôi</AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
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

const createStyles = (COLORS: typeof import("@/constants/theme").COLORS) =>
  StyleSheet.create({
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
