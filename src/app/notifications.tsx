import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS.text}
          />
        </Pressable>

        <AppText variant="subtitle">Thông báo</AppText>

        <View style={styles.headerSpace} />
      </View>

      <View style={styles.emptyState}>
        <Ionicons
          name="notifications-off-outline"
          size={64}
          color={COLORS.textMuted}
        />

        <AppText variant="subtitle">
          Chưa có thông báo
        </AppText>

        <AppText variant="body" color={COLORS.textMuted}>
          Các lượt thích và bình luận mới sẽ xuất hiện ở đây.
        </AppText>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

  emptyState: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
});