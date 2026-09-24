import AppText from "@/components/ui/AppText";
import { COLORS } from "@/constants/theme";
import { StyleSheet, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        style={styles.menuItem}
        onPress={() => router.push("../post/saved-posts")}
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
      <Pressable onPress={signOut} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>
      <AppText variant="title">Trang cá nhân</AppText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },
  logoutButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
  },

  logoutText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
  },
  menuItem: {
    minHeight: 64,
    paddingHorizontal: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderRadius: 12,
    backgroundColor: COLORS.surface,

    marginTop: 20,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.surfaceAlt,
  },
});
