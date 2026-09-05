import AppText from "@/components/ui/AppText";
import { COLORS, SPACING } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons
          name="alert-circle-outline"
          size={72}
          color={COLORS.primary}
        />

        <AppText variant="title">
          Không tìm thấy trang
        </AppText>

        <AppText
          style={styles.description}
          color={COLORS.textMuted}
        >
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </AppText>

        <Pressable
          style={styles.homeButton}
          onPress={() => router.replace("/")}
        >
          <Ionicons
            name="home-outline"
            size={20}
            color={COLORS.background}
          />

          <AppText style={styles.homeButtonText}>
            Về bảng tin
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

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },

  description: {
    textAlign: "center",
  },

  homeButton: {
    marginTop: SPACING.md,

    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,

    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,

    backgroundColor: COLORS.primary,
    borderRadius: 24,
  },

  homeButtonText: {
    color: COLORS.background,
    fontWeight: "600",
  },
});